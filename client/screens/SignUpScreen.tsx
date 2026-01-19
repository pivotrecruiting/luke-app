import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import { AntDesign } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Typography, Colors } from "@/constants/theme";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
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

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { isOnboardingComplete } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const isExpoGo = Constants.appOwnership === "expo";
  const redirectTo = isExpoGo
    ? makeRedirectUri()
    : makeRedirectUri({ scheme: "myapp" });
  // TODO: Add exp://** (Expo Go) and myapp://** (dev build/standalone) to Supabase Auth redirect URLs.

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => {
        setAppleAvailable(false);
      });
  }, []);

  const handlePostAuth = useCallback(() => {
    if (!isOnboardingComplete) {
      navigation.navigate("OnboardingCurrency");
    }
  }, [isOnboardingComplete, navigation]);

  const createSessionFromUrl = useCallback(
    async (url: string) => {
      const { params, errorCode } = QueryParams.getQueryParams(url);
      if (errorCode) {
        throw new Error(errorCode);
      }

      const accessToken = params.access_token as string | undefined;
      const refreshToken = params.refresh_token as string | undefined;

      if (!accessToken || !refreshToken) {
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        throw error;
      }

      handlePostAuth();
    },
    [handlePostAuth],
  );

  const url = Linking.useURL();
  useEffect(() => {
    if (!url) return;
    createSessionFromUrl(url).catch((error) => {
      setErrorMessage(error.message);
    });
  }, [url, createSessionFromUrl]);

  const handleEmailSignUp = async () => {
    if (!email || !password) {
      setErrorMessage("Bitte Email und Passwort eingeben.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setErrorMessage(error.message);
    } else if (!data.session) {
      setInfoMessage("Bitte bestätige deine Email, um fortzufahren.");
    } else {
      handlePostAuth();
    }

    setIsLoading(false);
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      setErrorMessage("Bitte Email und Passwort eingeben.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      handlePostAuth();
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(
      data?.url ?? "",
      redirectTo,
    );

    if (result.type === "success") {
      await createSessionFromUrl(result.url);
    }

    setIsLoading(false);
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error("Apple Sign-In fehlgeschlagen.");
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
        nonce: credential.nonce ?? undefined,
      });

      if (error) {
        throw error;
      }

      if (credential.fullName) {
        const fullNameParts = [
          credential.fullName.givenName,
          credential.fullName.familyName,
        ].filter(Boolean);

        if (fullNameParts.length > 0) {
          await supabase.auth.updateUser({
            data: {
              full_name: fullNameParts.join(" "),
            },
          });
        }
      }

      handlePostAuth();
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 80,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <Text style={styles.logo}>Luke</Text>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Erstelle einen Account</Text>
          <Text style={styles.subtitle}>
            Melde dich mit deiner E-Mail an, um loszulegen.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="email@domain.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Passwort"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            secureTextEntry
            editable={!isLoading}
          />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          {infoMessage ? (
            <Text style={styles.infoText}>{infoMessage}</Text>
          ) : null}

          <Pressable
            onPress={handleEmailSignUp}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.buttonPressed,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.light.buttonText} />
            ) : (
              <Text style={styles.continueButtonText}>Create account</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleEmailSignIn}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Sign in</Text>
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>oder</Text>
            <View style={styles.divider} />
          </View>

          <Pressable
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.socialButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <GoogleLogo size={20} />
            <Text style={styles.socialButtonText}>Anmelden über Google</Text>
          </Pressable>

          {appleAvailable ? (
            <Pressable
              onPress={handleAppleSignIn}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.socialButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <AntDesign name="apple" size={20} color="#000000" />
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </Pressable>
          ) : null}
          <Text style={styles.termsText}>
            Durch das Fortfahren stimmst du unseren{" "}
            <Text style={styles.termsLink}>AGB</Text> und dem{" "}
            <Text style={styles.termsLink}>Datenschutz</Text> zu.
          </Text>

          <Pressable style={styles.workshopCodeButton}>
            <Text style={styles.workshopCodeText}>
              Du hast einen Workshop-Code?
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
  },
  tealBlur: {
    position: "absolute",
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.light.teal,
    opacity: 0.6,
  },
  purpleBlur: {
    position: "absolute",
    bottom: -50,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.light.primary,
    opacity: 0.5,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  logo: {
    ...Typography.h1,
    color: Colors.light.text,
    fontWeight: "700",
    fontSize: 30,
  },
  formContainer: {
    marginTop: 64,
    paddingHorizontal: Spacing["2xl"],
    width: "100%",
    maxWidth: 350,
    alignItems: "center",
  },
  title: {
    ...Typography.h3,
    color: Colors.light.text,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.small,
    color: "#6B7280",
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    ...Typography.body,
    color: Colors.light.text,
    outlineStyle: "none",
  } as any,
  continueButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#1A1A1A",
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  continueButtonText: {
    ...Typography.body,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButton: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  secondaryButtonText: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: Spacing["2xl"],
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    ...Typography.small,
    color: "#9CA3AF",
    paddingHorizontal: Spacing.lg,
  },
  socialButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#F3F4F6",
    borderRadius: BorderRadius.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  socialButtonText: {
    ...Typography.body,
    fontWeight: "500",
    color: "#000000",
  },
  termsText: {
    ...Typography.tiny,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: Spacing["3xl"],
    lineHeight: 18,
  },
  termsLink: {
    color: "#6B7280",
    fontWeight: "500",
  },
  workshopCodeButton: {
    marginTop: Spacing.xl,
  },
  workshopCodeText: {
    ...Typography.body,
    color: "#4F46E5",
    fontWeight: "500",
    textDecorationLine: "none",
  },
  errorText: {
    ...Typography.small,
    color: "#DC2626",
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  infoText: {
    ...Typography.small,
    color: "#2563EB",
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
