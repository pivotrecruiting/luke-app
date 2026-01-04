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
import ProgressDots from "@/components/ProgressDots";
import Chip from "@/components/Chip";
import CurrencyInput from "@/components/CurrencyInput";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Typography, Colors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

const savingsGoals = [
  "Urlaub",
  "Führerschein",
  "Wohnung",
  "Hochzeit",
  "Schuldenfrei",
  "Notgroschen",
  "Uhr",
  "Auto",
  "Weihnachten",
  "Vespa",
  "Handy",
  "Bildschirm",
  "Laptop",
  "Klarna",
];

const goalIcons: Record<string, string> = {
  Urlaub: "sun",
  Führerschein: "truck",
  Wohnung: "home",
  Hochzeit: "heart",
  Schuldenfrei: "credit-card",
  Notgroschen: "dollar-sign",
  Uhr: "clock",
  Auto: "truck",
  Weihnachten: "gift",
  Vespa: "navigation",
  Handy: "smartphone",
  Bildschirm: "monitor",
  Laptop: "laptop",
  Klarna: "dollar-sign",
};

export default function Onboarding3Screen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [selectedGoal, setSelectedGoal] = useState("Wohnung");
  const [amount, setAmount] = useState("1000,00");
  const [monthlyAmount, setMonthlyAmount] = useState("200,00");

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <ProgressDots total={5} current={2} />

        <View style={styles.headerContainer}>
          <Text style={styles.titleBold}>Worauf sparst du?</Text>
          <Text style={styles.subtitle}>
            Dein erstes Ziel gibt deiner Reise eine{"\n"}Richtung
          </Text>
        </View>

        <View style={styles.chipsContainer}>
          {savingsGoals.map((goal) => (
            <Chip
              key={goal}
              label={goal}
              selected={selectedGoal === goal}
              onPress={() => setSelectedGoal(goal)}
            />
          ))}
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.nameInputContainer}>
              <Feather
                name={goalIcons[selectedGoal] as any || "target"}
                size={20}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.nameInput}
                value={selectedGoal}
                onChangeText={setSelectedGoal}
                placeholder="Zielname"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Summe</Text>
            <CurrencyInput
              value={amount}
              onChangeText={setAmount}
              highlighted={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monatlicher Beitrag</Text>
            <CurrencyInput
              value={monthlyAmount}
              onChangeText={setMonthlyAmount}
              highlighted={false}
            />
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>

      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Pressable
          onPress={() => navigation.navigate("Onboarding4")}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>WEITER</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
    paddingHorizontal: Spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    marginTop: Spacing["2xl"],
  },
  titleBold: {
    ...Typography.h1,
    color: Colors.light.text,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing["3xl"],
  },
  formContainer: {
    marginTop: Spacing["4xl"],
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.small,
    color: "#6B7280",
  },
  nameInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.light.inputBorderLight,
    paddingHorizontal: Spacing.lg,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  nameInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.text,
    padding: 0,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.light.backgroundRoot,
    paddingTop: Spacing.lg,
  },
  button: {
    backgroundColor: Colors.light.buttonPrimary,
    borderRadius: BorderRadius.md,
    height: Spacing.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.light.buttonText,
  },
});
