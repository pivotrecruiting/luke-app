import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

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

const createUserClient = (authorizationHeader: string): SupabaseClient => {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const supabaseAnonKey = getRequiredEnv("SUPABASE_ANON_KEY");

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: authorizationHeader,
      },
    },
  });
};

const deleteSpendRelatedRows = async (
  adminClient: SupabaseClient,
  userId: string,
): Promise<void> => {
  const { error: deleteSpendRequestFriendsError } = await adminClient
    .from("spend_request_friends")
    .delete()
    .eq("friend_id", userId);

  if (deleteSpendRequestFriendsError) {
    throw deleteSpendRequestFriendsError;
  }

  const { error: deleteSpendVotesError } = await adminClient
    .from("spend_votes")
    .delete()
    .eq("voter_id", userId);

  if (deleteSpendVotesError) {
    throw deleteSpendVotesError;
  }

  const { data: spendRequestRows, error: fetchSpendRequestsError } =
    await adminClient
      .from("spend_requests")
      .select("id")
      .eq("sender_id", userId);

  if (fetchSpendRequestsError) {
    throw fetchSpendRequestsError;
  }

  const spendRequestIds = (spendRequestRows ?? [])
    .map((row) => row.id)
    .filter((value): value is string => typeof value === "string");

  if (spendRequestIds.length === 0) {
    return;
  }

  const { error: deleteSpendVotesByRequestError } = await adminClient
    .from("spend_votes")
    .delete()
    .in("request_id", spendRequestIds);

  if (deleteSpendVotesByRequestError) {
    throw deleteSpendVotesByRequestError;
  }

  const { error: deleteSpendRequestFriendsByRequestError } = await adminClient
    .from("spend_request_friends")
    .delete()
    .in("request_id", spendRequestIds);

  if (deleteSpendRequestFriendsByRequestError) {
    throw deleteSpendRequestFriendsByRequestError;
  }

  const { error: deleteSpendRequestsError } = await adminClient
    .from("spend_requests")
    .delete()
    .eq("sender_id", userId);

  if (deleteSpendRequestsError) {
    throw deleteSpendRequestsError;
  }
};

Deno.serve(async (request: Request) => {
  console.log("delete-my-account: incoming request", {
    method: request.method,
    hasAuthorizationHeader: Boolean(request.headers.get("Authorization")),
    hasApiKeyHeader: Boolean(request.headers.get("apikey")),
  });

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const authorizationHeader = request.headers.get("Authorization");

    if (!authorizationHeader) {
      console.error("delete-my-account: missing authorization header");
      return jsonResponse({ error: "Missing authorization header." }, 401);
    }

    const userClient = createUserClient(authorizationHeader);
    const adminClient = createAdminClient();
    const token = authorizationHeader.replace(/^Bearer\s+/i, "").trim();
    console.log("delete-my-account: validating user", {
      tokenLength: token.length,
      authorizationPrefix: authorizationHeader.slice(0, 12),
    });
    const {
      data: { user },
      error: getUserError,
    } = await userClient.auth.getUser(token);

    if (getUserError || !user) {
      console.error("delete-my-account: user validation failed", {
        errorMessage: getUserError?.message ?? null,
        hasUser: Boolean(user),
      });
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    console.log("delete-my-account: user validated", {
      userId: user.id,
    });

    await deleteSpendRelatedRows(adminClient, user.id);
    console.log("delete-my-account: spend rows deleted", {
      userId: user.id,
    });

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(
      user.id,
    );

    if (deleteUserError) {
      console.error("delete-my-account: auth admin delete failed", {
        userId: user.id,
        errorMessage: deleteUserError.message,
      });
      throw deleteUserError;
    }

    console.log("delete-my-account: user deleted", {
      userId: user.id,
    });

    return jsonResponse({ success: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Account deletion could not be completed.";

    console.error("delete-my-account failed:", message);

    return jsonResponse(
      {
        error: message,
      },
      500,
    );
  }
});
