import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import { Redirect, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { Logo } from "@/components/logo";
import { Box, Text } from "@/components/restyle";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/utils/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const nextRoute = useMemo(
    () => sanitizeNextRoute(getFirstParam(params.next)),
    [params.next],
  );
  const { session, status } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Prüfe ob wir in Expo Go sind
  const isExpoGo =
    Constants.appOwnership === "expo" || Constants.appOwnership === "guest";

  const redirectBase = useMemo(() => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        return `${window.location.origin}/auth/callback`;
      }
      return "/auth/callback";
    }

    // In Expo Go: Verwende Expo Proxy (exp:// oder https://auth.expo.io/...)
    // In Development Build: Verwende Custom Scheme
    const redirectUri = isExpoGo
      ? AuthSession.makeRedirectUri({
          // Ohne scheme wird automatisch Expo Proxy verwendet
          path: "auth/callback",
        })
      : AuthSession.makeRedirectUri({
          scheme: "devsplit",
          path: "auth/callback",
        });

    // Logge die generierte URL für Debugging
    console.log("Generated redirect URI:", redirectUri);
    console.log("Is Expo Go:", isExpoGo);
    console.log("App ownership:", Constants.appOwnership);

    return redirectUri;
  }, [isExpoGo]);

  const redirectTo = useMemo(() => {
    const separator = redirectBase.includes("?") ? "&" : "?";
    return `${redirectBase}${separator}next=${encodeURIComponent(nextRoute)}`;
  }, [redirectBase, nextRoute]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "openid email profile",
          redirectTo,
          skipBrowserRedirect: Platform.OS !== "web",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw error;
      }

      if (Platform.OS !== "web" && data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo,
        );

        if (result.type === "cancel" || result.type === "dismiss") {
          setIsLoading(false);
          return;
        }

        if (result.type === "success" && result.url) {
          console.log("OAuth callback URL:", result.url);

          // Versuche URL zu parsen (kann Hash-basiert oder Query-Parameter sein)
          let url: URL;
          try {
            url = new URL(result.url);
          } catch {
            // Falls URL-Parsing fehlschlägt, versuche Hash-basierte Parameter
            const hashMatch = result.url.match(/#(.+)/);
            if (hashMatch) {
              const hashParams = new URLSearchParams(hashMatch[1]);
              const accessToken = hashParams.get("access_token");
              const refreshToken = hashParams.get("refresh_token");
              const code = hashParams.get("code");

              if (accessToken && refreshToken) {
                const { error: sessionError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });

                if (sessionError) {
                  throw sessionError;
                }

                setIsLoading(false);
                return;
              } else if (code) {
                // Code gefunden, navigiere zum Callback-Screen
                // Der Deep Link sollte automatisch zum Callback-Screen führen
                setIsLoading(false);
                return;
              }
            }
            throw new Error("URL konnte nicht geparst werden.");
          }

          // Versuche Query-Parameter
          const accessToken = url.searchParams.get("access_token");
          const refreshToken = url.searchParams.get("refresh_token");
          const code = url.searchParams.get("code");

          // Versuche auch Hash-Parameter (falls vorhanden)
          const hash = url.hash.substring(1);
          const hashParams = hash ? new URLSearchParams(hash) : null;
          const hashAccessToken = hashParams?.get("access_token");
          const hashRefreshToken = hashParams?.get("refresh_token");
          const hashCode = hashParams?.get("code");

          const finalAccessToken = accessToken || hashAccessToken;
          const finalRefreshToken = refreshToken || hashRefreshToken;
          const finalCode = code || hashCode;

          if (finalAccessToken && finalRefreshToken) {
            // Setze Session mit den extrahierten Tokens
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: finalAccessToken,
              refresh_token: finalRefreshToken,
            });

            if (sessionError) {
              throw sessionError;
            }

            // Session wurde erfolgreich gesetzt
            setIsLoading(false);
          } else if (finalCode) {
            // Code gefunden - navigiere zum Callback-Screen
            // Der Deep Link sollte automatisch zum Callback-Screen führen
            // Der Callback-Screen wird exchangeCodeForSession aufrufen
            console.log("Code gefunden, navigiere zum Callback-Screen");
            setIsLoading(false);
            // Navigation erfolgt automatisch über Deep Link
          } else {
            // Keine Tokens oder Code gefunden - logge die URL für Debugging
            console.error("URL-Struktur:", {
              url: result.url,
              searchParams: Object.fromEntries(url.searchParams),
              hash: url.hash,
            });
            // Versuche trotzdem zum Callback-Screen zu navigieren
            // Vielleicht wird der Code über Deep Link übergeben
            setIsLoading(false);
          }
        } else {
          throw new Error("Unerwarteter Antworttyp vom OAuth-Flow.");
        }
      }
    } catch (loginError) {
      console.error("Google login error:", loginError);
      setErrorMessage(
        loginError instanceof Error
          ? loginError.message
          : "Anmeldung fehlgeschlagen.",
      );
      setIsLoading(false);
    }
  }, [redirectTo]);

  if (status === "loading") {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <Box
          flex={1}
          alignItems="center"
          justifyContent="center"
          padding="lg"
          gap="sm"
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodySmall" color="mutedForeground">
            Vorbereitung …
          </Text>
        </Box>
      </SafeAreaView>
    );
  }

  if (session) {
    return <Redirect href={nextRoute as any} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Box
        flex={1}
        padding="lg"
        alignItems="center"
        justifyContent="center"
        style={{
          backgroundColor: theme.colors.background,
        }}
      >
        <Logo color="white" />

        <Box
          width="100%"
          style={{
            maxWidth: 380,
            marginTop: theme.spacing.xl,
          }}
        >
          <Box
            backgroundColor="card"
            borderRadius="2xl"
            padding="lg"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowOffset: { width: 0, height: 10 },
              shadowRadius: 25,
              elevation: 24,
            }}
          >
            <Box
              position="absolute"
              right={-8}
              top={-8}
              accessibilityElementsHidden
            >
              <Text variant="h2">🎉</Text>
            </Box>

            <Box gap="xs" marginBottom="lg">
              <Text variant="h2">Willkommen!</Text>
              <Text variant="bodySmall" color="mutedForeground">
                Melde dich mit deinem Google-Konto an, um deine Spaces zu
                verwalten.
              </Text>
            </Box>

            {errorMessage && (
              <Box
                marginBottom="md"
                padding="sm"
                borderRadius="md"
                backgroundColor="destructive"
              >
                <Text variant="bodySmall" color="white">
                  {errorMessage}
                </Text>
              </Box>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              <Box
                borderRadius="round"
                paddingVertical="md"
                paddingHorizontal="md"
                backgroundColor="white"
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
                gap="sm"
                borderWidth={1}
                borderColor="border"
              >
                <GoogleIcon />
                <Text variant="button" color="black">
                  {isLoading ? "Weiterleitung …" : "Mit Google anmelden"}
                </Text>
                {isLoading && (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                )}
              </Box>
            </TouchableOpacity>
          </Box>
        </Box>
      </Box>
    </SafeAreaView>
  );
}

function getFirstParam(value?: string | string[]): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function sanitizeNextRoute(next?: string): "/(tabs)/spaces" | string {
  const fallback: "/(tabs)/spaces" = "/(tabs)/spaces";
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  return next as string;
}

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}
