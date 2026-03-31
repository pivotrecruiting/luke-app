import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  buildRevenueCatGrantMetadata,
  isUuid,
  normalizeStringArray,
  resolveAccessWindowFromEvent,
  resolveCandidateAppUserIds,
  resolveEntitlementKeyFromEvent,
  resolveGrantStatusFromEvent,
  resolvePlatformFromStore,
  type AccessGrantStatusT,
  type RevenueCatEventT,
  type RevenueCatWebhookPayloadT,
} from "../_shared/revenuecat-webhook.ts";

type JsonT =
  | string
  | number
  | boolean
  | null
  | JsonT[]
  | { [key: string]: JsonT };

type RevenueCatCustomerRowT = {
  user_id: string;
  app_user_id: string;
  aliases: string[] | null;
};

type RevenueCatEventLogRowT = {
  id: string;
};

type BillingConfigRowT = {
  pro_access_key: string;
};

type BillingProductMappingRowT = {
  id: string;
  billing_product_id: string;
  revenuecat_entitlement_id: string;
};

type UserAccessGrantRowT = {
  id: string;
  metadata: Record<string, JsonT> | null;
};

type ResolvedIdentityT = {
  userId: string;
  canonicalAppUserId: string;
  aliases: string[];
};

const jsonResponse = (body: Record<string, unknown>, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const getRequiredEnv = (name: string): string => {
  const value = Deno.env.get(name)?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const createAdminClient = (): SupabaseClient => {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const normalizeAuthorizationValue = (
  value: string | null | undefined,
): string | null => {
  const trimmedValue = value?.trim().replace(/^["']|["']$/g, "") ?? "";

  if (!trimmedValue) {
    return null;
  }

  if (/^Bearer\s+/i.test(trimmedValue)) {
    return trimmedValue.replace(/^Bearer\s+/i, "").trim() || null;
  }

  return trimmedValue;
};

const resolveEventAppUserId = (event: RevenueCatEventT): string | null =>
  event.app_user_id?.trim() ??
  event.original_app_user_id?.trim() ??
  resolveCandidateAppUserIds(event)[0] ??
  null;

const verifyWebhookAuthorization = (request: Request): boolean => {
  const expectedSecret = getRequiredEnv("REVENUECAT_WEBHOOK_AUTH_HEADER");
  const authorizationHeader = request.headers.get("Authorization");
  const normalizedExpectedSecret = normalizeAuthorizationValue(expectedSecret);
  const normalizedAuthorizationHeader =
    normalizeAuthorizationValue(authorizationHeader);

  return (
    Boolean(normalizedExpectedSecret) &&
    normalizedAuthorizationHeader === normalizedExpectedSecret
  );
};

const fetchBillingConfig = async (
  adminClient: SupabaseClient,
): Promise<BillingConfigRowT> => {
  const { data, error } = await adminClient
    .from("billing_config")
    .select("pro_access_key")
    .eq("config_key", "default")
    .single();

  if (error) {
    throw error;
  }

  return data as BillingConfigRowT;
};

const findBillingProductMapping = async (
  adminClient: SupabaseClient,
  event: RevenueCatEventT,
): Promise<BillingProductMappingRowT | null> => {
  const platform = resolvePlatformFromStore(event.store);
  const productId = event.product_id?.trim();

  if (!platform || !productId) {
    return null;
  }

  const { data, error } = await adminClient
    .from("billing_product_store_mappings")
    .select("id, billing_product_id, revenuecat_entitlement_id")
    .eq("active", true)
    .eq("platform", platform)
    .eq("store_product_id", productId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as BillingProductMappingRowT | null) ?? null;
};

const resolveIdentity = async (
  adminClient: SupabaseClient,
  event: RevenueCatEventT,
): Promise<ResolvedIdentityT> => {
  const candidateAppUserIds = resolveCandidateAppUserIds(event);
  const uuidCandidates = candidateAppUserIds.filter((value) => isUuid(value));

  if (candidateAppUserIds.length > 0) {
    const { data, error } = await adminClient
      .from("revenuecat_customers")
      .select("user_id, app_user_id, aliases")
      .in("app_user_id", candidateAppUserIds);

    if (error) {
      throw error;
    }

    const customerRows = (data ?? []) as RevenueCatCustomerRowT[];
    const exactMatch =
      customerRows.find((row) => row.app_user_id === event.app_user_id) ??
      customerRows.find(
        (row) => row.app_user_id === event.original_app_user_id,
      ) ??
      customerRows[0];

    if (exactMatch) {
      return {
        userId: exactMatch.user_id,
        canonicalAppUserId: event.app_user_id?.trim() || exactMatch.app_user_id,
        aliases: normalizeStringArray([
          ...(exactMatch.aliases ?? []),
          ...candidateAppUserIds,
        ]),
      };
    }
  }

  const directUserId = uuidCandidates[0];

  if (!directUserId) {
    throw new Error(
      "Unable to resolve Supabase user from RevenueCat app_user_id.",
    );
  }

  return {
    userId: directUserId,
    canonicalAppUserId: event.app_user_id?.trim() || directUserId,
    aliases: candidateAppUserIds,
  };
};

const ensureUserExists = async (
  adminClient: SupabaseClient,
  userId: string,
): Promise<void> => {
  const { error } = await adminClient
    .from("users")
    .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });

  if (error) {
    throw error;
  }
};

const upsertRevenueCatCustomer = async (
  adminClient: SupabaseClient,
  identity: ResolvedIdentityT,
  event: RevenueCatEventT,
): Promise<void> => {
  const now = new Date().toISOString();
  const { error } = await adminClient.from("revenuecat_customers").upsert(
    {
      user_id: identity.userId,
      app_user_id: identity.canonicalAppUserId,
      original_app_user_id: event.original_app_user_id?.trim() ?? null,
      aliases: identity.aliases,
      last_seen_at: now,
      last_synced_at: now,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw error;
  }
};

const findExistingRevenueCatGrant = async (
  adminClient: SupabaseClient,
  userId: string,
  accessKey: string,
): Promise<UserAccessGrantRowT | null> => {
  const { data, error } = await adminClient
    .from("user_access_grants")
    .select("id, metadata")
    .eq("user_id", userId)
    .eq("source_type", "revenuecat")
    .eq("access_key", accessKey)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as UserAccessGrantRowT | null) ?? null;
};

const syncRevenueCatGrant = async (
  adminClient: SupabaseClient,
  params: {
    userId: string;
    accessKey: string;
    status: Exclude<AccessGrantStatusT, null>;
    startsAt: string;
    endsAt: string | null;
    sourceId: string | null;
    metadata: Record<string, unknown>;
  },
): Promise<void> => {
  const existingGrant = await findExistingRevenueCatGrant(
    adminClient,
    params.userId,
    params.accessKey,
  );

  if (!existingGrant) {
    if (params.status !== "active") {
      return;
    }

    const { error } = await adminClient.from("user_access_grants").insert({
      user_id: params.userId,
      access_key: params.accessKey,
      source_type: "revenuecat",
      source_id: params.sourceId,
      status: params.status,
      starts_at: params.startsAt,
      ends_at: params.endsAt,
      metadata: params.metadata,
    });

    if (error) {
      throw error;
    }

    return;
  }

  const mergedMetadata = {
    ...(existingGrant.metadata ?? {}),
    ...params.metadata,
  };

  const { error } = await adminClient
    .from("user_access_grants")
    .update({
      source_id: params.sourceId,
      status: params.status,
      starts_at: params.startsAt,
      ends_at: params.endsAt,
      metadata: mergedMetadata,
    })
    .eq("id", existingGrant.id);

  if (error) {
    throw error;
  }
};

const insertEventLog = async (
  adminClient: SupabaseClient,
  event: RevenueCatEventT,
  payload: RevenueCatWebhookPayloadT,
): Promise<RevenueCatEventLogRowT | null> => {
  const eventId = event.id?.trim();
  const eventType = event.type?.trim();
  const appUserId = resolveEventAppUserId(event);

  if (!eventId || !eventType || !appUserId) {
    throw new Error(
      "RevenueCat webhook payload is missing required event fields.",
    );
  }

  const { data: existingEvent, error: existingEventError } = await adminClient
    .from("revenuecat_events")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existingEventError) {
    throw existingEventError;
  }

  if (existingEvent) {
    return null;
  }

  const { data, error } = await adminClient
    .from("revenuecat_events")
    .insert({
      event_id: eventId,
      event_type: eventType,
      app_user_id: appUserId,
      original_app_user_id: event.original_app_user_id?.trim() ?? null,
      environment: event.environment?.trim() ?? null,
      payload,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data as RevenueCatEventLogRowT;
};

const markEventProcessed = async (
  adminClient: SupabaseClient,
  eventId: string,
): Promise<void> => {
  const { error } = await adminClient
    .from("revenuecat_events")
    .update({
      processed_at: new Date().toISOString(),
      processing_error: null,
    })
    .eq("event_id", eventId);

  if (error) {
    throw error;
  }
};

const markEventFailed = async (
  adminClient: SupabaseClient,
  eventId: string,
  errorMessage: string,
): Promise<void> => {
  const { error } = await adminClient
    .from("revenuecat_events")
    .update({
      processing_error: errorMessage,
    })
    .eq("event_id", eventId);

  if (error) {
    console.error("Failed to persist RevenueCat processing error:", error);
  }
};

const processWebhook = async (
  adminClient: SupabaseClient,
  payload: RevenueCatWebhookPayloadT,
): Promise<{ duplicate: boolean }> => {
  const event = payload.event;

  if (!event?.id || !event.type || !resolveEventAppUserId(event)) {
    throw new Error(
      "RevenueCat webhook payload is missing required event information.",
    );
  }

  const eventLog = await insertEventLog(adminClient, event, payload);

  if (!eventLog) {
    return { duplicate: true };
  }

  try {
    const grantStatus = resolveGrantStatusFromEvent(event.type);

    if (!grantStatus) {
      await markEventProcessed(adminClient, event.id);
      return { duplicate: false };
    }

    const [billingConfig, billingProductMapping, identity] = await Promise.all([
      fetchBillingConfig(adminClient),
      findBillingProductMapping(adminClient, event),
      resolveIdentity(adminClient, event),
    ]);

    await ensureUserExists(adminClient, identity.userId);
    await upsertRevenueCatCustomer(adminClient, identity, event);

    const accessKey =
      billingProductMapping?.revenuecat_entitlement_id ??
      resolveEntitlementKeyFromEvent(event, billingConfig.pro_access_key);
    const { startsAt, endsAt } = resolveAccessWindowFromEvent(event);
    const metadata = buildRevenueCatGrantMetadata(event, {
      billing_product_id: billingProductMapping?.billing_product_id ?? null,
      billing_mapping_id: billingProductMapping?.id ?? null,
      synced_at: new Date().toISOString(),
    });

    await syncRevenueCatGrant(adminClient, {
      userId: identity.userId,
      accessKey,
      status: grantStatus,
      startsAt,
      endsAt,
      sourceId: billingProductMapping?.billing_product_id ?? null,
      metadata,
    });

    await markEventProcessed(adminClient, event.id);
    return { duplicate: false };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown RevenueCat processing error.";
    await markEventFailed(adminClient, event.id, errorMessage);
    throw error;
  }
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    if (!verifyWebhookAuthorization(request)) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }
  } catch (error) {
    console.error("RevenueCat webhook secret misconfiguration:", error);
    return jsonResponse({ error: "Webhook configuration invalid." }, 500);
  }

  let payload: RevenueCatWebhookPayloadT;

  try {
    payload = (await request.json()) as RevenueCatWebhookPayloadT;
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  try {
    const adminClient = createAdminClient();
    const result = await processWebhook(adminClient, payload);

    return jsonResponse({
      ok: true,
      duplicate: result.duplicate,
      event_id: payload.event?.id ?? null,
      event_type: payload.event?.type ?? null,
    });
  } catch (error) {
    console.error("RevenueCat webhook processing failed:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown RevenueCat webhook error.";

    return jsonResponse(
      {
        ok: false,
        error: errorMessage,
        event_id: payload.event?.id ?? null,
      },
      500,
    );
  }
});
