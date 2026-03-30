import * as AppleAuthentication from "expo-apple-authentication";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { AuthScreenLayout } from "@/components/auth-screen-layout";
import { PurpleGradientButton } from "@/components/ui/purple-gradient-button";
import { Colors, Spacing, Typography } from "@/constants/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import {
  completeAuthSessionIfNeeded,
  signInWithOAuth,
  signUpWithEmailPassword,
  type OAuthProviderT,
} from "@/services/auth-service";
import { AppModal } from "@/components/ui/app-modal";
import { authScreenStyles } from "@/screens/styles/auth-screen.styles";
import { isValidEmail } from "@/utils/validation";
import {
  clearPendingWorkshopCode,
  loadPendingWorkshopCode,
} from "@/services/local-storage";
import {
  normalizeWorkshopCode,
  rememberPendingWorkshopCode,
  type SignupMethodT,
  validateWorkshopCode,
} from "@/services/workshop-code-service";

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;
completeAuthSessionIfNeeded();

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [workshopCodeInput, setWorkshopCodeInput] = useState("");
  const [appliedWorkshopCode, setAppliedWorkshopCode] = useState("");
  const [codeStatus, setCodeStatus] = useState<"neutral" | "valid" | "invalid">(
    "neutral",
  );
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);
  const [isWorkshopCodeLoading, setIsWorkshopCodeLoading] = useState(false);
  const [workshopCodeMessage, setWorkshopCodeMessage] = useState<string | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (Platform.OS !== "ios") {
      return () => {
        isMounted = false;
      };
    }

    AppleAuthentication.isAvailableAsync()
      .then((isAvailable) => {
        if (isMounted) {
          setIsAppleAuthAvailable(isAvailable);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAppleAuthAvailable(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    void loadPendingWorkshopCode()
      .then((pendingWorkshopCode) => {
        if (!isMounted || !pendingWorkshopCode?.code) {
          return;
        }

        setAppliedWorkshopCode(pendingWorkshopCode.code);
        setWorkshopCodeInput(pendingWorkshopCode.code);
        setCodeStatus("valid");
        setWorkshopCodeMessage(null);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenRequestPassword = () => {
    navigation.navigate("RequestPassword", {
      email: email.trim().toLowerCase() || undefined,
    });
  };

  const persistWorkshopCodeForSignup = async (
    signupMethod: SignupMethodT,
  ): Promise<string | null> => {
    const normalizedCode = normalizeWorkshopCode(appliedWorkshopCode);

    if (!normalizedCode) {
      await clearPendingWorkshopCode();
      return null;
    }

    await rememberPendingWorkshopCode(normalizedCode, signupMethod);
    return normalizedCode;
  };

  const handleEmailSignUp = async () => {
    if (isAuthLoading) return;
    setSuccessMessage(null);
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      Alert.alert("Fehlende Angaben", "Bitte E-Mail und Passwort ausfüllen.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert("Ungültige E-Mail", "Bitte prüfe deine E-Mail-Adresse.");
      return;
    }

    setIsAuthLoading(true);
    try {
      const normalizedWorkshopCode =
        await persistWorkshopCodeForSignup("email");
      const result = await signUpWithEmailPassword(
        trimmedEmail,
        password,
        normalizedWorkshopCode ?? undefined,
      );

      if (result.status === "signed-in") {
        return;
      }

      if (result.status === "email-confirmation-required") {
        setSuccessMessage(
          "Verifikations-E-Mail gesendet. Bitte prüfe dein Postfach.",
        );
        return;
      }

      console.error("Email sign up failed:", result.message);
      Alert.alert("Registrierung fehlgeschlagen", "Bitte versuche es erneut.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: OAuthProviderT) => {
    if (isAuthLoading) return;
    setIsAuthLoading(true);
    try {
      await persistWorkshopCodeForSignup(provider);
      const result = await signInWithOAuth(provider);

      if (result.status === "signed-in") {
        return;
      }

      if (result.status === "cancelled") {
        return;
      }

      console.error("OAuth sign in failed:", result.message);
      Alert.alert("Login fehlgeschlagen", "Bitte versuche es erneut.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Erstelle einen Account"
      subtitle="Melde dich mit deiner E-Mail an, um loszulegen."
      footer={
        <>
          <Text style={authScreenStyles.termsText}>
            Durch das Fortfahren stimmst du unseren{" "}
            <Text style={authScreenStyles.termsLink}>AGB</Text> und dem{" "}
            <Text style={authScreenStyles.termsLink}>Datenschutz</Text> zu.
          </Text>

          <Pressable
            style={authScreenStyles.workshopCodeButton}
            onPress={() => setShowWorkshopModal(true)}
          >
            <Text style={authScreenStyles.workshopCodeText}>
              {appliedWorkshopCode
                ? `Workshop-Code ${appliedWorkshopCode} aktiv`
                : "Du hast einen Workshop-Code?"}
            </Text>
          </Pressable>
        </>
      }
    >
      <TextInput
        style={authScreenStyles.input}
        placeholder="email@domain.com"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (successMessage) {
            setSuccessMessage(null);
          }
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />

      <TextInput
        style={[authScreenStyles.input, authScreenStyles.inputWithTightSpacing]}
        placeholder="Passwort"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          if (successMessage) {
            setSuccessMessage(null);
          }
        }}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="password"
        textContentType="newPassword"
        secureTextEntry={true}
        onSubmitEditing={handleEmailSignUp}
      />

      <Pressable
        style={({ pressed }) => [
          authScreenStyles.forgotPasswordButton,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={handleOpenRequestPassword}
      >
        <Text style={authScreenStyles.forgotPasswordText}>
          Passwort vergessen?
        </Text>
      </Pressable>

      <Pressable
        onPress={handleEmailSignUp}
        style={({ pressed }) => [
          authScreenStyles.primaryButton,
          isAuthLoading && authScreenStyles.buttonDisabled,
          pressed && authScreenStyles.buttonPressed,
        ]}
        disabled={isAuthLoading}
      >
        <Text style={authScreenStyles.primaryButtonText}>
          {isAuthLoading ? "Bitte warten..." : "Fortfahren"}
        </Text>
      </Pressable>

      {successMessage ? (
        <View
          style={authScreenStyles.successMessageContainer}
          accessible={true}
        >
          <Text
            style={authScreenStyles.successMessageText}
            accessibilityRole="text"
            accessibilityLiveRegion="polite"
          >
            {successMessage}
          </Text>
        </View>
      ) : null}

      <View style={authScreenStyles.dividerContainer}>
        <View style={authScreenStyles.divider} />
        <Text style={authScreenStyles.dividerText}>oder</Text>
        <View style={authScreenStyles.divider} />
      </View>

      <Pressable
        onPress={() => handleOAuthSignIn("google")}
        style={({ pressed }) => [
          authScreenStyles.socialButton,
          isAuthLoading && authScreenStyles.buttonDisabled,
          pressed && authScreenStyles.buttonPressed,
        ]}
        disabled={isAuthLoading}
      >
        <GoogleLogo size={20} />
        <Text style={authScreenStyles.socialButtonText}>
          Anmelden über Google
        </Text>
      </Pressable>

      {Platform.OS === "ios" ? (
        isAppleAuthAvailable ? (
          <View
            style={[
              signUpScreenStyles.appleButtonContainer,
              isAuthLoading && authScreenStyles.buttonDisabled,
            ]}
          >
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
              }
              buttonStyle={
                AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={12}
              style={signUpScreenStyles.appleButton}
              onPress={() => {
                void handleOAuthSignIn("apple");
              }}
            />
          </View>
        ) : null
      ) : (
        <Pressable
          onPress={() => handleOAuthSignIn("apple")}
          style={({ pressed }) => [
            authScreenStyles.socialButton,
            isAuthLoading && authScreenStyles.buttonDisabled,
            pressed && authScreenStyles.buttonPressed,
          ]}
          disabled={isAuthLoading}
        >
          <AntDesign name="apple" size={20} color="#000000" />
          <Text style={authScreenStyles.socialButtonText}>
            Anmelden über Apple
          </Text>
        </Pressable>
      )}

      <AppModal
        visible={showWorkshopModal}
        onClose={() => setShowWorkshopModal(false)}
        keyboardAvoidingEnabled={true}
        keyboardVerticalOffset={Spacing.lg}
        keyboardShiftFactor={1}
        contentStyle={[
          modalStyles.modalContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={modalStyles.modalHandle} />
        <Text style={modalStyles.modalTitle}>Workshop-Zugang freischalten</Text>
        <Text style={modalStyles.modalSubtitle}>
          Gib dein persönlichen Code ein
        </Text>

        <TextInput
          style={[
            modalStyles.modalInput,
            codeStatus === "valid" && modalStyles.inputValid,
            codeStatus === "invalid" && modalStyles.inputInvalid,
          ]}
          placeholder="DEIN CODE HIER"
          placeholderTextColor="#9CA3AF"
          value={workshopCodeInput}
          onChangeText={(text) => {
            setWorkshopCodeInput(text);
            setCodeStatus("neutral");
            setWorkshopCodeMessage(null);
          }}
          autoCapitalize="characters"
        />

        <PurpleGradientButton
          onPress={async () => {
            const normalizedCode = normalizeWorkshopCode(workshopCodeInput);

            if (!normalizedCode) {
              setCodeStatus("invalid");
              setWorkshopCodeMessage("Bitte gib einen Workshop-Code ein.");
              return;
            }

            setIsWorkshopCodeLoading(true);
            try {
              const validationResult =
                await validateWorkshopCode(normalizedCode);

              if (validationResult.status !== "valid") {
                setCodeStatus("invalid");
                setWorkshopCodeMessage(
                  validationResult.message ??
                    "Dieser Workshop-Code ist nicht verfügbar.",
                );
                return;
              }

              await rememberPendingWorkshopCode(normalizedCode);
              setAppliedWorkshopCode(normalizedCode);
              setWorkshopCodeInput(normalizedCode);
              setCodeStatus("valid");
              setWorkshopCodeMessage(null);
              setShowWorkshopModal(false);
            } finally {
              setIsWorkshopCodeLoading(false);
            }
          }}
          style={modalStyles.activateButton}
          disabled={isWorkshopCodeLoading}
        >
          <Text style={modalStyles.activateButtonText}>
            {isWorkshopCodeLoading ? "CODE WIRD GEPRUEFT..." : "CODE SPEICHERN"}
          </Text>
        </PurpleGradientButton>

        {workshopCodeMessage ? (
          <Text style={modalStyles.errorText}>{workshopCodeMessage}</Text>
        ) : null}

        {appliedWorkshopCode ? (
          <Text style={modalStyles.modalFooterText}>
            Code {appliedWorkshopCode} wird beim Signup serverseitig geprueft.
          </Text>
        ) : (
          <Text style={modalStyles.modalFooterText}>
            Der Code wird erst beim Signup im Hintergrund ausgewertet.
          </Text>
        )}

        {appliedWorkshopCode ? (
          <Pressable
            onPress={async () => {
              await clearPendingWorkshopCode();
              setAppliedWorkshopCode("");
              setWorkshopCodeInput("");
              setCodeStatus("neutral");
              setWorkshopCodeMessage(null);
            }}
            style={modalStyles.clearButton}
          >
            <Text style={modalStyles.clearButtonText}>Code entfernen</Text>
          </Pressable>
        ) : null}
      </AppModal>
    </AuthScreenLayout>
  );
}

const signUpScreenStyles = StyleSheet.create({
  appleButtonContainer: {
    width: "100%",
    marginTop: Spacing.md,
  },
  appleButton: {
    width: "100%",
    height: 48,
  },
});

const modalStyles = StyleSheet.create({
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing.xl,
    alignItems: "center",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.light.text,
    textAlign: "center",
    fontWeight: "700",
  },
  modalSubtitle: {
    ...Typography.small,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
  },
  modalInput: {
    width: "100%",
    height: 56,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginTop: Spacing["2xl"],
    paddingHorizontal: Spacing.xl,
    textAlign: "center",
    fontSize: 16,
    color: Colors.light.text,
  },
  inputValid: {
    borderColor: "#22C55E",
  },
  inputInvalid: {
    borderColor: "#EF4444",
  },
  activateButton: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing["2xl"],
  },
  activateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  modalFooterText: {
    ...Typography.tiny,
    color: "#9CA3AF",
    marginTop: Spacing.md,
    textAlign: "center",
  },
  errorText: {
    ...Typography.small,
    color: "#EF4444",
    marginTop: Spacing.md,
    textAlign: "center",
  },
  clearButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  clearButtonText: {
    ...Typography.small,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
});
