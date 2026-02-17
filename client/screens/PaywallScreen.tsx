import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();

  const handleContinue = () => {
    completeOnboarding();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.placeholder}>Paywall Platzhalter</Text>
        <Text style={styles.subtext}>Design wird später implementiert</Text>
      </View>

      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.continueButtonOuter,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={["#9B7DFF", "#7340fd"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>CONTINUE</Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.disclaimer}>
          This subscription automatically renews after the 7-day free trial. You
          can cancel anytime.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(157, 113, 245, 0.5)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  placeholder: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtext: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: Spacing.md,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  continueButtonOuter: {
    borderRadius: BorderRadius.xl,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#7340fd",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButton: {
    height: 56,
    borderRadius: BorderRadius.xl - 3,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  disclaimer: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
});
