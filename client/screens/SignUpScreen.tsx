import React, { useState } from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Typography, Colors } from "@/constants/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import {
  completeAuthSessionIfNeeded,
  signInWithOAuth,
  signUpWithEmailPassword,
  type OAuthProviderT,
} from "@/services/auth-service";
import { AppModal } from "@/components/ui/app-modal";
import { isValidEmail } from "@/utils/validation";

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
  const [workshopCode, setWorkshopCode] = useState("");
  const [codeStatus, setCodeStatus] = useState<"neutral" | "valid" | "invalid">(
    "neutral",
  );
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      const result = await signUpWithEmailPassword(trimmedEmail, password);

      if (result.status === "signed-in") {
        navigation.navigate("OnboardingCurrency");
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
      const result = await signInWithOAuth(provider);

      if (result.status === "signed-in") {
        navigation.navigate("OnboardingCurrency");
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
            style={[styles.input, styles.passwordInput]}
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
            onPress={handleEmailSignUp}
            style={({ pressed }) => [
              styles.continueButton,
              isAuthLoading && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            disabled={isAuthLoading}
          >
            <Text style={styles.continueButtonText}>
              {isAuthLoading ? "Bitte warten..." : "Fortfahren"}
            </Text>
          </Pressable>

          {successMessage ? (
            <View style={styles.successMessageContainer} accessible={true}>
              <Text
                style={styles.successMessageText}
                accessibilityRole="text"
                accessibilityLiveRegion="polite"
              >
                {successMessage}
              </Text>
            </View>
          ) : null}

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>oder</Text>
            <View style={styles.divider} />
          </View>

          <Pressable
            onPress={() => handleOAuthSignIn("google")}
            style={({ pressed }) => [
              styles.socialButton,
              isAuthLoading && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            disabled={isAuthLoading}
          >
            <GoogleLogo size={20} />
            <Text style={styles.socialButtonText}>Anmelden über Google</Text>
          </Pressable>

          <Pressable
            onPress={() => handleOAuthSignIn("apple")}
            style={({ pressed }) => [
              styles.socialButton,
              isAuthLoading && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            disabled={isAuthLoading}
          >
            <AntDesign name="apple" size={20} color="#000000" />
            <Text style={styles.socialButtonText}>Anmelden über Apple</Text>
          </Pressable>

          <Text style={styles.termsText}>
            Durch das Fortfahren stimmst du unseren{" "}
            <Text style={styles.termsLink}>AGB</Text> und dem{" "}
            <Text style={styles.termsLink}>Datenschutz</Text> zu.
          </Text>

          <Pressable
            style={styles.workshopCodeButton}
            onPress={() => setShowWorkshopModal(true)}
          >
            <Text style={styles.workshopCodeText}>
              Du hast einen Workshop-Code?
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>

      <AppModal
        visible={showWorkshopModal}
        onClose={() => setShowWorkshopModal(false)}
        contentStyle={[
          styles.modalContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Workshop-Zugang freischalten</Text>
        <Text style={styles.modalSubtitle}>Gib dein persönlichen Code ein</Text>

        <TextInput
          style={[
            styles.modalInput,
            codeStatus === "valid" && styles.inputValid,
            codeStatus === "invalid" && styles.inputInvalid,
          ]}
          placeholder="DEIN CODE HIER"
          placeholderTextColor="#9CA3AF"
          value={workshopCode}
          onChangeText={(text) => {
            setWorkshopCode(text);
            setCodeStatus("neutral");
          }}
          autoCapitalize="characters"
        />

        <Pressable
          onPress={() => {
            const validCodes = ["12345", "LUKE2024", "WORKSHOP"];
            if (validCodes.includes(workshopCode.toUpperCase())) {
              setCodeStatus("valid");
              setTimeout(() => {
                setShowWorkshopModal(false);
                setWorkshopCode("");
                setCodeStatus("neutral");
                navigation.navigate("OnboardingCurrency");
              }, 600);
            } else {
              setCodeStatus("invalid");
            }
          }}
          style={({ pressed }) => [
            styles.activateButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.activateButtonText}>CODE AKTIVIEREN</Text>
        </Pressable>

        <Text style={styles.modalFooterText}>4 Wochen kostenlos nutzen.</Text>
      </AppModal>
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
    marginTop: Spacing["3xl"],
    ...Typography.body,
    color: Colors.light.text,
    outlineStyle: "none",
  } as any,
  passwordInput: {
    marginTop: Spacing.md,
  },
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
  successMessageContainer: {
    width: "100%",
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.light.successBackground,
    borderWidth: 1,
    borderColor: Colors.light.successBorder,
  },
  successMessageText: {
    ...Typography.small,
    color: Colors.light.success,
    textAlign: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
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
    borderBottomWidth: 1,
    borderBottomColor: "#4F46E5",
    paddingBottom: 2,
  },
  workshopCodeText: {
    ...Typography.small,
    color: "#4F46E5",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
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
    outlineStyle: "none",
  } as any,
  inputValid: {
    borderColor: "#22C55E",
  },
  inputInvalid: {
    borderColor: "#EF4444",
  },
  activateButton: {
    width: "100%",
    height: 56,
    backgroundColor: Colors.light.primary,
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
});
