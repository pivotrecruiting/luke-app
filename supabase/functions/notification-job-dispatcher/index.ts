import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  createAdminClient,
  isRetryableExpoError,
  jsonResponse,
  mapPermanentDeliveryFailure,
  type JsonT,
  type NotificationDeliveryStatusT,
  type NotificationJobRowT,
  type PushTokenRowT,
  verifyFunctionAuthorization,
} from "../_shared/push-notifications.ts";

type ExpoPushMessageT = {
  to: string;
  title: string;
  body: string;
  data: Record<string, JsonT>;
  channelId?: string;
};

type ExpoPushTicketT = {
  id?: string;
  status?: "ok" | "error";
  message?: string;
  details?: Record<string, unknown>;
};

type DeliveryRecordT = {
  notification_job_id: string;
  push_token_id: string;
  provider_message_id: string | null;
  status: NotificationDeliveryStatusT;
  provider_response: Record<string, unknown>;
  error_message: string | null;
};

const EXPO_PUSH_SEND_URL = "https://exp.host/--/api/v2/push/send";

const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
};

const fetchClaimedJobs = async (
  adminClient: SupabaseClient,
  limit: number,
): Promise<NotificationJobRowT[]> => {
  const { data, error } = await adminClient.rpc(
    "claim_pending_notification_jobs",
    {
      input_limit: limit,
      input_reference_at: new Date().toISOString(),
    },
  );

  if (error) {
    throw error;
  }

  return (data ?? []) as NotificationJobRowT[];
};

const fetchActivePushTokens = async (
  adminClient: SupabaseClient,
  userId: string,
): Promise<PushTokenRowT[]> => {
  const { data, error } = await adminClient
    .from("push_tokens")
    .select("id, token, platform")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  return (data ?? []) as PushTokenRowT[];
};

const updateNotificationJob = async (
  adminClient: SupabaseClient,
  jobId: string,
  status: "pending" | "sent" | "failed" | "cancelled",
  errorMessage: string | null,
): Promise<void> => {
  const payload: Record<string, unknown> = {
    status,
    error_message: errorMessage,
  };

  if (status === "sent") {
    payload.sent_at = new Date().toISOString();
  }

  const { error } = await adminClient
    .from("notification_jobs")
    .update(payload)
    .eq("id", jobId);

  if (error) {
    throw error;
  }
};

const upsertDeliveries = async (
  adminClient: SupabaseClient,
  deliveries: DeliveryRecordT[],
): Promise<void> => {
  if (deliveries.length === 0) {
    return;
  }

  const { error } = await adminClient
    .from("notification_deliveries")
    .upsert(deliveries, {
      onConflict: "notification_job_id,push_token_id",
    });

  if (error) {
    throw error;
  }
};

const deactivateInvalidTokens = async (
  adminClient: SupabaseClient,
  tokenIds: string[],
): Promise<void> => {
  if (tokenIds.length === 0) {
    return;
  }

  const { error } = await adminClient
    .from("push_tokens")
    .update({
      is_active: false,
    })
    .in("id", tokenIds);

  if (error) {
    throw error;
  }
};

const sendMessagesToExpo = async (
  messages: ExpoPushMessageT[],
): Promise<ExpoPushTicketT[]> => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const accessToken = Deno.env.get("EXPO_PUSH_ACCESS_TOKEN")?.trim() ?? "";

  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(EXPO_PUSH_SEND_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Expo push API request failed (${response.status}): ${responseText}`,
    );
  }

  const responseBody = (await response.json()) as {
    data?: ExpoPushTicketT[];
  };

  return Array.isArray(responseBody.data) ? responseBody.data : [];
};

const buildExpoMessage = (
  token: PushTokenRowT,
  payload: NotificationJobRowT["payload"],
): ExpoPushMessageT | null => {
  const title = payload?.title?.trim() ?? "";
  const body = payload?.body?.trim() ?? "";

  if (!title || !body) {
    return null;
  }

  return {
    to: token.token,
    title,
    body,
    data: {
      deeplink:
        typeof payload?.deeplink === "string"
          ? payload.deeplink
          : "luke://home",
    },
    channelId: token.platform === "android" ? "default" : undefined,
  };
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  if (!verifyFunctionAuthorization(request)) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  try {
    const adminClient = createAdminClient();
    const body = (await request.json().catch(() => ({}))) as {
      limit?: number;
    };
    const limit = Math.max(1, Math.min(body.limit ?? 100, 500));
    const jobs = await fetchClaimedJobs(adminClient, limit);

    let sentJobs = 0;
    let retriedJobs = 0;
    let failedJobs = 0;
    let cancelledJobs = 0;
    let deliveryCount = 0;
    let invalidatedTokenCount = 0;

    for (const job of jobs) {
      const tokens = await fetchActivePushTokens(adminClient, job.user_id);

      if (tokens.length === 0) {
        await updateNotificationJob(
          adminClient,
          job.job_id,
          "cancelled",
          "No active push tokens available.",
        );
        cancelledJobs += 1;
        continue;
      }

      const messagePayloads = tokens
        .map((token) => ({
          token,
          message: buildExpoMessage(token, job.payload),
        }))
        .filter(
          (
            entry,
          ): entry is { token: PushTokenRowT; message: ExpoPushMessageT } =>
            entry.message !== null,
        );

      if (messagePayloads.length === 0) {
        await updateNotificationJob(
          adminClient,
          job.job_id,
          "failed",
          "Notification payload is missing title or body.",
        );
        failedJobs += 1;
        continue;
      }

      const deliveries: DeliveryRecordT[] = [];
      const invalidTokenIds: string[] = [];
      let jobHasSuccessfulDelivery = false;
      let jobShouldRetry = false;

      try {
        for (const chunk of chunkArray(messagePayloads, 100)) {
          const tickets = await sendMessagesToExpo(
            chunk.map((entry) => entry.message),
          );

          chunk.forEach((entry, index) => {
            const ticket = tickets[index] ?? {
              status: "error",
              message: "Missing Expo ticket response.",
            };
            const rawTicket = ticket as Record<string, unknown>;

            if (ticket.status === "ok") {
              deliveries.push({
                notification_job_id: job.job_id,
                push_token_id: entry.token.id,
                provider_message_id: ticket.id ?? null,
                status: "sent",
                provider_response: rawTicket,
                error_message: null,
              });
              jobHasSuccessfulDelivery = true;
              return;
            }

            const deliveryStatus = mapPermanentDeliveryFailure(rawTicket);
            const retryable = isRetryableExpoError(rawTicket);

            deliveries.push({
              notification_job_id: job.job_id,
              push_token_id: entry.token.id,
              provider_message_id: ticket.id ?? null,
              status: retryable ? "failed" : deliveryStatus,
              provider_response: rawTicket,
              error_message:
                typeof ticket.message === "string" ? ticket.message : null,
            });

            if (deliveryStatus === "invalid_token") {
              invalidTokenIds.push(entry.token.id);
            }

            if (retryable) {
              jobShouldRetry = true;
            }
          });
        }
      } catch (error) {
        await updateNotificationJob(
          adminClient,
          job.job_id,
          "pending",
          error instanceof Error ? error.message : "Expo push request failed.",
        );
        retriedJobs += 1;
        continue;
      }

      await upsertDeliveries(adminClient, deliveries);
      await deactivateInvalidTokens(adminClient, invalidTokenIds);
      deliveryCount += deliveries.length;
      invalidatedTokenCount += invalidTokenIds.length;

      if (jobHasSuccessfulDelivery) {
        await updateNotificationJob(adminClient, job.job_id, "sent", null);
        sentJobs += 1;
        continue;
      }

      if (jobShouldRetry) {
        await updateNotificationJob(
          adminClient,
          job.job_id,
          "pending",
          "Retryable Expo push error.",
        );
        retriedJobs += 1;
        continue;
      }

      await updateNotificationJob(
        adminClient,
        job.job_id,
        "failed",
        "All push deliveries failed permanently.",
      );
      failedJobs += 1;
    }

    return jsonResponse({
      ok: true,
      processedJobs: jobs.length,
      sentJobs,
      retriedJobs,
      failedJobs,
      cancelledJobs,
      deliveryCount,
      invalidatedTokenCount,
    });
  } catch (error) {
    console.error("Failed to dispatch push notifications:", error);

    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});
