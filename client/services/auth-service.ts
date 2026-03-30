import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "@/lib/supabase";

export type OAuthProviderT = "google" | "apple";

type AuthErrorT = {
  status: "error";
  message: string;
};

type AuthSuccessResultT = {
  status: "success";
};

export type EmailSignUpResultT =
  | { status: "signed-in" }
  | { status: "email-confirmation-required" }
  | AuthErrorT;

export type OAuthSignInResultT =
  | { status: "signed-in" }
  | { status: "cancelled" }
  | AuthErrorT;

export type UpdateUserResultT = AuthSuccessResultT | AuthErrorT;

export type AuthCallbackResultT =
  | { status: "signed-in" }
  | { status: "password-recovery" }
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

type OAuthCallbackParamsT = {
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
  type: string | null;
  errorCode: string | null;
  errorDescription: string | null;
};

const getParam = (
  searchParams: URLSearchParams | null,
  key: string,
): string | null => {
  if (!searchParams) return null;
  const value = searchParams.get(key);
  return value && value.length > 0 ? value : null;
};

const extractOAuthCallbackParams = (url: string): OAuthCallbackParamsT => {
  try {
    const parsedUrl = new URL(url);
    const hashParams = parsedUrl.hash
      ? new URLSearchParams(parsedUrl.hash.replace(/^#/, ""))
      : null;

    const accessToken =
      getParam(parsedUrl.searchParams, "access_token") ??
      getParam(hashParams, "access_token");
    const refreshToken =
      getParam(parsedUrl.searchParams, "refresh_token") ??
      getParam(hashParams, "refresh_token");
    const code =
      getParam(parsedUrl.searchParams, "code") ?? getParam(hashParams, "code");
    const type =
      getParam(parsedUrl.searchParams, "type") ?? getParam(hashParams, "type");
    const errorCode =
      getParam(parsedUrl.searchParams, "error_code") ??
      getParam(hashParams, "error_code") ??
      getParam(parsedUrl.searchParams, "error") ??
      getParam(hashParams, "error");
    const errorDescription =
      getParam(parsedUrl.searchParams, "error_description") ??
      getParam(hashParams, "error_description");

    return {
      accessToken,
      refreshToken,
      code,
      type,
      errorCode,
      errorDescription,
    };
  } catch {
    // Fallback for callback URLs that cannot be parsed by URL().
    const queryMatch = url.match(/\?([^#]+)/);
    const hashMatch = url.match(/#(.+)$/);
    const queryParams = queryMatch ? new URLSearchParams(queryMatch[1]) : null;
    const hashParams = hashMatch ? new URLSearchParams(hashMatch[1]) : null;

    const accessToken =
      getParam(queryParams, "access_token") ??
      getParam(hashParams, "access_token");
    const refreshToken =
      getParam(queryParams, "refresh_token") ??
      getParam(hashParams, "refresh_token");
    const code = getParam(queryParams, "code") ?? getParam(hashParams, "code");
    const type = getParam(queryParams, "type") ?? getParam(hashParams, "type");
    const errorCode =
      getParam(queryParams, "error_code") ??
      getParam(hashParams, "error_code") ??
      getParam(queryParams, "error") ??
      getParam(hashParams, "error");
    const errorDescription =
      getParam(queryParams, "error_description") ??
      getParam(hashParams, "error_description");

    return {
      accessToken,
      refreshToken,
      code,
      type,
      errorCode,
      errorDescription,
    };
  }
};

export const completeAuthCallbackFromUrl = async (
  callbackUrl: string,
): Promise<AuthCallbackResultT> => {
  const { accessToken, refreshToken, code, type, errorCode, errorDescription } =
    extractOAuthCallbackParams(callbackUrl);

  if (errorCode || errorDescription) {
    return {
      status: "error",
      message: errorDescription ?? errorCode ?? "OAuth callback failed",
    };
  }

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    return {
      status: type === "recovery" ? "password-recovery" : "signed-in",
    };
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return { status: "error", message: error.message };
    }

    return {
      status: type === "recovery" ? "password-recovery" : "signed-in",
    };
  }

  return {
    status: "error",
    message: "Missing auth tokens in OAuth callback URL",
  };
};

const createSessionFromOAuthCallback = async (
  callbackUrl: string,
): Promise<OAuthSignInResultT> => {
  const result = await completeAuthCallbackFromUrl(callbackUrl);

  if (result.status === "error") {
    return result;
  }

  return { status: "signed-in" };
};

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

    return await createSessionFromOAuthCallback(result.url);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const updateUserFullName = async (
  fullName: string,
  currentMetadata?: unknown,
): Promise<UpdateUserResultT> => {
  try {
    const safeMetadata =
      currentMetadata &&
      typeof currentMetadata === "object" &&
      !Array.isArray(currentMetadata)
        ? currentMetadata
        : {};

    const { error } = await supabase.auth.updateUser({
      data: {
        ...safeMetadata,
        full_name: fullName.trim(),
      },
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const updateUserEmail = async (
  email: string,
): Promise<UpdateUserResultT> => {
  try {
    const { error } = await supabase.auth.updateUser(
      { email: email.trim().toLowerCase() },
      { emailRedirectTo: getAuthRedirectUrl() },
    );

    if (error) {
      return { status: "error", message: error.message };
    }

    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const sendPasswordResetEmail = async (
  email: string,
): Promise<UpdateUserResultT> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getAuthRedirectUrl(),
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const updateUserPassword = async (
  password: string,
): Promise<UpdateUserResultT> => {
  try {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { status: "error", message: error.message };
    }

    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
