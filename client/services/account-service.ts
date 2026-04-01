import { supabase } from "@/lib/supabase";

/**
 * Deletes the currently authenticated account via a protected Edge Function.
 */
export const deleteMyAccount = async (): Promise<void> => {
  const {
    data: { session: initialSession },
    error: initialSessionError,
  } = await supabase.auth.getSession();

  if (initialSessionError) {
    throw initialSessionError;
  }

  if (!initialSession) {
    throw new Error("Keine aktive Session gefunden.");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw userError ?? new Error("Kein authentifizierter User gefunden.");
  }

  const { data: refreshData, error: refreshError } =
    await supabase.auth.refreshSession();

  if (refreshError) {
    throw refreshError;
  }

  const nextSession = refreshData.session ?? initialSession;

  if (!nextSession?.access_token) {
    throw new Error("Session konnte nicht aktualisiert werden.");
  }

  console.log("deleteMyAccount: invoking function", {
    userId: userData.user.id,
    refreshedSession: Boolean(refreshData.session),
    accessTokenLength: nextSession.access_token.length,
  });

  const { data, error } = await supabase.functions.invoke("delete-my-account", {
    body: {},
    headers: {
      Authorization: `Bearer ${nextSession.access_token}`,
    },
  });

  if (!error) {
    console.log("deleteMyAccount: function succeeded", { data });
    return;
  }

  console.error("deleteMyAccount: function failed", {
    name: error.name,
    message: error.message,
    context: "delete-my-account",
  });

  throw error;
};
