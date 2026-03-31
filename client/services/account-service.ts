import { supabase } from "@/lib/supabase";

/**
 * Deletes the currently authenticated account via a protected Edge Function.
 */
export const deleteMyAccount = async (): Promise<void> => {
  const { error } = await supabase.functions.invoke("delete-my-account", {
    body: {},
  });

  if (error) {
    throw error;
  }
};
