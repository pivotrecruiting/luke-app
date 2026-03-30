import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { z } from "zod";
import { AuthScreenLayout } from "@/components/auth-screen-layout";
import { sendPasswordResetEmail } from "@/services/auth-service";
import { authScreenStyles } from "@/screens/styles/auth-screen.styles";
import { isValidEmail } from "@/utils/validation";

type RequestPasswordRouteParamsT = {
  RequestPassword:
    | {
        email?: string;
      }
    | undefined;
};

const emailSchema = z
  .string()
  .trim()
  .min(1, "Bitte gib deine E-Mail-Adresse ein.")
  .refine(isValidEmail, "Bitte gib eine gültige E-Mail-Adresse ein.");

/**
 * Lets the user request a password reset email from the auth flow or profile.
 */
export default function RequestPasswordScreen() {
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<RequestPasswordRouteParamsT, "RequestPassword">>();
  const initialEmail = useMemo(
    () => route.params?.email?.trim() ?? "",
    [route],
  );
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const parsedEmail = emailSchema.safeParse(email);
    setEmailError(
      parsedEmail.success
        ? null
        : (parsedEmail.error.issues[0]?.message ?? null),
    );

    if (!parsedEmail.success) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      const result = await sendPasswordResetEmail(
        parsedEmail.data.toLowerCase(),
      );

      if (result.status === "error") {
        setEmailError(result.message);
        return;
      }

      setSuccessMessage(
        "Wir haben dir eine E-Mail mit einem Link zum Zurücksetzen deines Passworts gesendet.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Passwort vergessen?"
      subtitle="Gib deine E-Mail-Adresse ein. Wir senden dir einen sicheren Link zum Zurücksetzen."
    >
      <TextInput
        style={[
          authScreenStyles.input,
          emailError ? authScreenStyles.inputError : null,
        ]}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (emailError) {
            setEmailError(null);
          }
          if (successMessage) {
            setSuccessMessage(null);
          }
        }}
        placeholder="name@beispiel.de"
        placeholderTextColor="#9CA3AF"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        editable={!isSubmitting}
        accessibilityLabel="E-Mail-Adresse"
        onSubmitEditing={handleSubmit}
      />

      {emailError ? (
        <Text style={authScreenStyles.inlineErrorText}>{emailError}</Text>
      ) : null}

      {successMessage ? (
        <View style={authScreenStyles.successMessageContainer}>
          <Text style={authScreenStyles.successMessageText}>
            {successMessage}
          </Text>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          authScreenStyles.primaryButton,
          isSubmitting && authScreenStyles.buttonDisabled,
          pressed && authScreenStyles.buttonPressed,
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={authScreenStyles.primaryButtonText}>
          {isSubmitting ? "Wird gesendet..." : "Reset-Link senden"}
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          authScreenStyles.secondaryButton,
          isSubmitting && authScreenStyles.buttonDisabled,
          pressed && authScreenStyles.buttonPressed,
        ]}
        onPress={() => navigation.goBack()}
        disabled={isSubmitting}
      >
        <Text style={authScreenStyles.secondaryButtonText}>Zurück</Text>
      </Pressable>
    </AuthScreenLayout>
  );
}
