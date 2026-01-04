import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Typography, Colors } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState("");

  return (
    <View style={styles.container}>
      <View style={[styles.tealBlur, { top: -50 - insets.top }]} />
      <View style={styles.purpleBlur} />

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
          <Text style={styles.title}>Create an account</Text>
          <Text style={styles.subtitle}>
            Enter your email to sign up for this app
          </Text>

          <TextInput
            style={styles.input}
            placeholder="email@domain.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Pressable
            onPress={() => navigation.navigate("Onboarding1")}
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <Pressable
            onPress={() => navigation.navigate("Onboarding1")}
            style={({ pressed }) => [
              styles.socialButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Feather name="mail" size={20} color="#EA4335" />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("Onboarding1")}
            style={({ pressed }) => [
              styles.socialButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Feather name="smartphone" size={20} color="#000000" />
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </Pressable>

          <Text style={styles.termsText}>
            By clicking continue, you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
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
    marginTop: Spacing["3xl"],
    ...Typography.body,
    color: Colors.light.text,
  },
  continueButton: {
    width: "100%",
    height: 48,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  continueButtonText: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.light.buttonText,
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
    borderWidth: 1,
    borderColor: "#D1D5DB",
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
    color: Colors.light.text,
  },
  termsText: {
    ...Typography.tiny,
    color: "#6B7280",
    textAlign: "center",
    marginTop: Spacing["3xl"],
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.light.text,
    textDecorationLine: "underline",
  },
});
