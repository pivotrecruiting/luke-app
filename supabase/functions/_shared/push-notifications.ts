import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export type JsonT =
  | string
  | number
  | boolean
  | null
  | JsonT[]
  | { [key: string]: JsonT };

export type NotificationJobRowT = {
  job_id: string;
  user_id: string;
  campaign_key: string;
  payload: {
    title?: string | null;
    body?: string | null;
    deeplink?: string | null;
    [key: string]: JsonT | undefined;
  } | null;
};

export type PushTokenRowT = {
  id: string;
  token: string;
  platform: string;
};

export type NotificationDeliveryStatusT =
  | "pending"
  | "sent"
  | "failed"
  | "invalid_token";

export const jsonResponse = (
  body: Record<string, unknown>,
  status = 200,
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getRequiredEnv = (name: string): string => {
  const value = Deno.env.get(name)?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const createAdminClient = (): SupabaseClient => {
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

export const verifyFunctionAuthorization = (request: Request): boolean => {
  const expectedSecret = getRequiredEnv("NOTIFICATION_FUNCTION_AUTH_HEADER");
  const authorizationHeader = request.headers.get("Authorization");

  return (
    normalizeAuthorizationValue(expectedSecret) ===
    normalizeAuthorizationValue(authorizationHeader)
  );
};

export const mapPermanentDeliveryFailure = (
  expoResponse: Record<string, unknown>,
): NotificationDeliveryStatusT => {
  const details =
    typeof expoResponse.details === "object" && expoResponse.details
      ? (expoResponse.details as Record<string, unknown>)
      : null;
  const errorCode =
    details && typeof details.error === "string" ? details.error : null;

  if (errorCode === "DeviceNotRegistered") {
    return "invalid_token";
  }

  return "failed";
};

export const isRetryableExpoError = (
  expoResponse: Record<string, unknown>,
): boolean => {
  const details =
    typeof expoResponse.details === "object" && expoResponse.details
      ? (expoResponse.details as Record<string, unknown>)
      : null;
  const errorCode =
    details && typeof details.error === "string" ? details.error : null;

  return (
    errorCode === "MessageRateExceeded" ||
    errorCode === "PUSH_TOO_MANY_EXPERIENCE_IDS"
  );
};
