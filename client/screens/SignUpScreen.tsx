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
import { Feather, AntDesign } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Typography, Colors } from "@/constants/theme";

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
            <GoogleLogo size={20} />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("Onboarding1")}
            style={({ pressed }) => [
              styles.socialButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <AntDesign name="apple" size={20} color="#000000" />
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
