import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { z } from "zod";
import { AuthScreenLayout } from "@/components/auth-screen-layout";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { authScreenStyles } from "@/screens/styles/auth-screen.styles";
import { updateUserPassword } from "@/services/auth-service";

const passwordSchema = z.string().min(1, "Bitte gib ein neues Passwort ein.");

/**
 * Allows the user to set a new password after opening a Supabase recovery link.
 */
export default function ResetPasswordScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const parsedPassword = passwordSchema.safeParse(password);
    setPasswordError(
      parsedPassword.success
        ? null
        : (parsedPassword.error.issues[0]?.message ?? null),
    );

    const passwordsMatch = password === confirmPassword;
    setConfirmPasswordError(
      passwordsMatch ? null : "Die Passwörter stimmen nicht überein.",
    );

    if (!parsedPassword.success || !passwordsMatch) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateUserPassword(parsedPassword.data);

      if (result.status === "error") {
        Alert.alert("Passwort konnte nicht gesetzt werden", result.message);
        return;
      }

      Alert.alert(
        "Passwort aktualisiert",
        "Dein Passwort wurde erfolgreich geändert.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Passwort zurücksetzen"
      subtitle="Vergib jetzt ein neues Passwort, das du bisher noch nicht für Luke genutzt hast."
    >
      <TextInput
        style={[
          authScreenStyles.input,
          passwordError ? authScreenStyles.inputError : null,
        ]}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (passwordError) {
            setPasswordError(null);
          }
        }}
        placeholder="Neues Passwort"
        placeholderTextColor="#9CA3AF"
        secureTextEntry={true}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!isSubmitting}
        accessibilityLabel="Neues Passwort"
      />

      {passwordError ? (
        <Text style={authScreenStyles.inlineErrorText}>{passwordError}</Text>
      ) : null}

      <TextInput
        style={[
          authScreenStyles.input,
          authScreenStyles.inputWithTightSpacing,
          confirmPasswordError ? authScreenStyles.inputError : null,
        ]}
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          if (confirmPasswordError) {
            setConfirmPasswordError(null);
          }
        }}
        placeholder="Passwort wiederholen"
        placeholderTextColor="#9CA3AF"
        secureTextEntry={true}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!isSubmitting}
        accessibilityLabel="Passwort bestätigen"
        onSubmitEditing={handleSubmit}
      />

      {confirmPasswordError ? (
        <Text style={authScreenStyles.inlineErrorText}>
          {confirmPasswordError}
        </Text>
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
          {isSubmitting ? "Speichern..." : "Passwort speichern"}
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
        <Text style={authScreenStyles.secondaryButtonText}>Abbrechen</Text>
      </Pressable>
    </AuthScreenLayout>
  );
}
