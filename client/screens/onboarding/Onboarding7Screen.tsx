import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import ProgressDots from "@/components/ProgressDots";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import {
  useOnboardingStore,
  type OnboardingStoreT,
} from "@/stores/onboarding-store";

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

export default function Onboarding7Screen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const incomeEntries = useOnboardingStore(
    (state: OnboardingStoreT) => state.incomeEntries,
  );
  const expenseEntries = useOnboardingStore(
    (state: OnboardingStoreT) => state.expenseEntries,
  );
  const totalIncome = useMemo(
    () => incomeEntries.reduce((sum, entry) => sum + entry.amount, 0),
    [incomeEntries],
  );
  const totalFixedExpenses = useMemo(
    () => expenseEntries.reduce((sum, entry) => sum + entry.amount, 0),
    [expenseEntries],
  );
  const verfuegbar = totalIncome - totalFixedExpenses;

  const formatCurrency = (value: number, showPlus: boolean = false) => {
    const formatted = value.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    if (showPlus && value > 0) {
      return `+ ${formatted}`;
    }
    return formatted;
  };

  const handleContinue = () => {
    navigation.navigate("Onboarding8");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      <View style={styles.content}>
        <ProgressDots total={6} current={5} />

        <Text style={styles.title}>Dein monatlicher Spielraum</Text>
        <Text style={styles.subtitle}>Luke hat gerechnet!</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Einkommen</Text>
            <Text style={styles.incomeValue}>
              {formatCurrency(totalIncome, true)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Fixkosten</Text>
            <Text style={styles.expenseValue}>
              - {formatCurrency(totalFixedExpenses)}
            </Text>
          </View>

          <View style={styles.totalSection}>
            <Text style={styles.totalValue}>
              {formatCurrency(verfuegbar, true)}
            </Text>
            <Text style={styles.totalLabel}>Verfügbar</Text>
          </View>
        </View>

        <Text style={styles.description}>
          Das ist das Geld, das dir zum Leben, Sparen und für deine Budgets
          bleibt.
        </Text>
      </View>

      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>BUDGET FESTLEGEN</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginTop: Spacing["3xl"],
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    marginBottom: Spacing["3xl"],
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  rowLabel: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000000",
  },
  incomeValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#22C55E",
  },
  expenseValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#EF4444",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  totalSection: {
    alignItems: "center",
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing.lg,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "#2D9A8C",
    marginBottom: Spacing.xs,
  },
  totalLabel: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  description: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: Spacing["3xl"],
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    backgroundColor: "#FFFFFF",
  },
  continueButton: {
    backgroundColor: "#8E97FD",
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
