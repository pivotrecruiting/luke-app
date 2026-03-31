export type RevenueCatEventTypeT =
  | "BILLING_ISSUE"
  | "CANCELLATION"
  | "EXPIRATION"
  | "INITIAL_PURCHASE"
  | "NON_RENEWING_PURCHASE"
  | "PRODUCT_CHANGE"
  | "REFUND"
  | "REFUND_REVERSED"
  | "RENEWAL"
  | "SUBSCRIPTION_EXTENDED"
  | "TEMPORARY_ENTITLEMENT_GRANT"
  | "TEST"
  | "TRANSFER"
  | "UNCANCELLATION"
  | string;

export type RevenueCatEventT = {
  id?: string;
  type?: RevenueCatEventTypeT;
  app_user_id?: string | null;
  original_app_user_id?: string | null;
  aliases?: string[] | null;
  entitlement_ids?: string[] | null;
  product_id?: string | null;
  store?: string | null;
  environment?: string | null;
  purchased_at_ms?: number | null;
  expiration_at_ms?: number | null;
  event_timestamp_ms?: number | null;
  grace_period_expiration_at_ms?: number | null;
  transaction_id?: string | null;
  original_transaction_id?: string | null;
  period_type?: string | null;
  ownership_type?: string | null;
  cancel_reason?: string | null;
  price?: number | null;
  price_in_purchased_currency?: number | null;
  currency?: string | null;
  transferred_from?: string[] | null;
  transferred_to?: string[] | null;
};

export type RevenueCatWebhookPayloadT = {
  api_version?: string;
  event?: RevenueCatEventT;
};

export type AccessGrantStatusT = "active" | "expired" | "revoked" | null;

const TERMINAL_EXPIRED_EVENT_TYPES = new Set<RevenueCatEventTypeT>([
  "EXPIRATION",
]);
const TERMINAL_REVOKED_EVENT_TYPES = new Set<RevenueCatEventTypeT>(["REFUND"]);
const NOOP_EVENT_TYPES = new Set<RevenueCatEventTypeT>(["TEST", "TRANSFER"]);

export const isUuid = (value: string | null | undefined): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );

export const toIsoTimestamp = (
  value: number | string | null | undefined,
): string | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  if (typeof value === "string" && value.trim()) {
    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      return new Date(numericValue).toISOString();
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
};

export const normalizeStringArray = (
  values: string[] | null | undefined,
): string[] =>
  Array.from(
    new Set(
      (values ?? [])
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );

export const resolveCandidateAppUserIds = (
  event: RevenueCatEventT,
): string[] => {
  const aliases = normalizeStringArray(event.aliases);
  const transferredFrom = normalizeStringArray(event.transferred_from);
  const transferredTo = normalizeStringArray(event.transferred_to);

  return Array.from(
    new Set(
      [
        event.app_user_id?.trim(),
        event.original_app_user_id?.trim(),
        ...aliases,
        ...transferredFrom,
        ...transferredTo,
      ].filter((value): value is string => Boolean(value)),
    ),
  );
};

export const resolvePlatformFromStore = (
  store: string | null | undefined,
): "ios" | "android" | null => {
  const normalizedStore = store?.trim().toUpperCase();

  if (!normalizedStore) {
    return null;
  }

  if (normalizedStore === "APP_STORE" || normalizedStore === "MAC_APP_STORE") {
    return "ios";
  }

  if (normalizedStore === "PLAY_STORE" || normalizedStore === "AMAZON") {
    return "android";
  }

  return null;
};

export const resolveGrantStatusFromEvent = (
  eventType: RevenueCatEventTypeT | null | undefined,
): AccessGrantStatusT => {
  if (!eventType || NOOP_EVENT_TYPES.has(eventType)) {
    return null;
  }

  if (TERMINAL_EXPIRED_EVENT_TYPES.has(eventType)) {
    return "expired";
  }

  if (TERMINAL_REVOKED_EVENT_TYPES.has(eventType)) {
    return "revoked";
  }

  return "active";
};

export const resolveAccessWindowFromEvent = (
  event: RevenueCatEventT,
): {
  startsAt: string;
  endsAt: string | null;
} => {
  const startsAt =
    toIsoTimestamp(event.purchased_at_ms) ??
    toIsoTimestamp(event.event_timestamp_ms) ??
    new Date().toISOString();

  const endsAt =
    toIsoTimestamp(event.grace_period_expiration_at_ms) ??
    toIsoTimestamp(event.expiration_at_ms);

  return {
    startsAt,
    endsAt,
  };
};

export const resolveEntitlementKeyFromEvent = (
  event: RevenueCatEventT,
  fallbackAccessKey: string,
): string => {
  const entitlementKey = normalizeStringArray(event.entitlement_ids)[0];
  return entitlementKey ?? fallbackAccessKey;
};

export const buildRevenueCatGrantMetadata = (
  event: RevenueCatEventT,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  provider: "revenuecat",
  latest_event_id: event.id ?? null,
  latest_event_type: event.type ?? null,
  app_user_id: event.app_user_id ?? null,
  original_app_user_id: event.original_app_user_id ?? null,
  aliases: normalizeStringArray(event.aliases),
  entitlement_ids: normalizeStringArray(event.entitlement_ids),
  product_id: event.product_id ?? null,
  store: event.store ?? null,
  environment: event.environment ?? null,
  purchased_at: toIsoTimestamp(event.purchased_at_ms),
  expires_at: toIsoTimestamp(event.expiration_at_ms),
  grace_period_expires_at: toIsoTimestamp(event.grace_period_expiration_at_ms),
  transaction_id: event.transaction_id ?? null,
  original_transaction_id: event.original_transaction_id ?? null,
  period_type: event.period_type ?? null,
  ownership_type: event.ownership_type ?? null,
  cancel_reason: event.cancel_reason ?? null,
  transferred_from: normalizeStringArray(event.transferred_from),
  transferred_to: normalizeStringArray(event.transferred_to),
  ...overrides,
});
