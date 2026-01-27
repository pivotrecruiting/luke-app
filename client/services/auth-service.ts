import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "@/lib/supabase";

export type OAuthProviderT = "google" | "apple";

type AuthErrorT = {
  status: "error";
  message: string;
};

export type EmailSignUpResultT =
  | { status: "signed-in" }
  | { status: "email-confirmation-required" }
  | AuthErrorT;

export type OAuthSignInResultT =
  | { status: "signed-in" }
  | { status: "cancelled" }
  | AuthErrorT;

type AuthErrorLikeT = {
  message?: string;
  status?: number;
  code?: string;
  name?: string;
};

const isUserAlreadyRegisteredError = (error: AuthErrorLikeT) => {
  const message = error.message?.toLowerCase() ?? "";
  const code = error.code?.toLowerCase() ?? "";

  return (
    code === "user_already_exists" ||
    code === "email_exists" ||
    message.includes("already registered") ||
    message.includes("already exists")
  );
};

const isEmailNotConfirmedError = (error: AuthErrorLikeT) => {
  const message = error.message?.toLowerCase() ?? "";
  const code = error.code?.toLowerCase() ?? "";

  return (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed") ||
    message.includes("confirm your email")
  );
};

const getAuthRedirectUrl = () =>
  makeRedirectUri({
    path: "auth/callback",
  });

export const completeAuthSessionIfNeeded = () => {
  WebBrowser.maybeCompleteAuthSession();
};

export const signUpWithEmailPassword = async (
  email: string,
  password: string,
): Promise<EmailSignUpResultT> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });

    if (error) {
      if (isUserAlreadyRegisteredError(error)) {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError) {
          if (isEmailNotConfirmedError(signInError)) {
            return { status: "email-confirmation-required" };
          }
          return { status: "error", message: signInError.message };
        }

        if (signInData.session) {
          return { status: "signed-in" };
        }

        return { status: "error", message: "Login failed." };
      }

      return { status: "error", message: error.message };
    }

    if (data.session) {
      return { status: "signed-in" };
    }

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      if (isEmailNotConfirmedError(signInError)) {
        return { status: "email-confirmation-required" };
      }
      return { status: "error", message: signInError.message };
    }

    if (signInData.session) {
      return { status: "signed-in" };
    }

    return { status: "email-confirmation-required" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const signInWithOAuth = async (
  provider: OAuthProviderT,
): Promise<OAuthSignInResultT> => {
  try {
    const redirectTo = getAuthRedirectUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      return {
        status: "error",
        message: error?.message ?? "Missing OAuth URL",
      };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== "success" || !result.url) {
      return { status: "cancelled" };
    }

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      result.url,
    );

    if (exchangeError) {
      return { status: "error", message: exchangeError.message };
    }

    return { status: "signed-in" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
