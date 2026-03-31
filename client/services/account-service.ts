import { supabase } from "@/lib/supabase";

/**
 * Deletes the currently authenticated account via a protected Edge Function.
 */
export const deleteMyAccount = async (): Promise<void> => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session?.access_token) {
    throw new Error("Keine aktive Session gefunden.");
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !publishableKey) {
    throw new Error("Supabase-Konfiguration fehlt.");
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/delete-my-account`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: publishableKey,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({}),
    },
  );

  if (response.ok) {
    return;
  }

  let errorMessage = `Account konnte nicht gelöscht werden (HTTP ${response.status}).`;
  const responseText = await response.text();

  try {
    const errorPayload = JSON.parse(responseText) as { error?: string };

    if (typeof errorPayload.error === "string" && errorPayload.error.trim()) {
      errorMessage = errorPayload.error;
    }
  } catch {
    if (responseText.trim()) {
      errorMessage = responseText.trim();
    }
  }

  throw new Error(errorMessage);
};
