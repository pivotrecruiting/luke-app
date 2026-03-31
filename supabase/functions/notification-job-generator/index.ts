import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createAdminClient,
  jsonResponse,
  verifyFunctionAuthorization,
} from "../_shared/push-notifications.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  if (!verifyFunctionAuthorization(request)) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  try {
    const adminClient = createAdminClient();
    const referenceAt = new Date().toISOString();

    const { data, error } = await adminClient.rpc(
      "queue_due_notification_jobs",
      {
        input_reference_at: referenceAt,
      },
    );

    if (error) {
      throw error;
    }

    return jsonResponse({
      ok: true,
      queuedAt: referenceAt,
      result: data,
    });
  } catch (error) {
    console.error("Failed to queue notification jobs:", error);

    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});
