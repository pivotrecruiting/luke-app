import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProgressDots from "@/components/ProgressDots";
import Chip from "@/components/Chip";
import CurrencyInput from "@/components/CurrencyInput";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Typography, Colors } from "@/constants/theme";

const expenseTypes = [
  "Versicherungen",
  "Netflix",
  "Wohnen",
  "Handy",
  "Altersvorsorge",
  "Spotify",
  "Fitness",
  "Abos",
  "Fahrticket",
  "Auswärts essen",
];

export default function Onboarding5Screen() {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [amount, setAmount] = useState("0,00");

  const handleComplete = () => {
    Alert.alert(
      "Onboarding Complete",
      "Welcome to Luke! Your financial journey begins now.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <ProgressDots total={5} current={4} />

        <View style={styles.headerContainer}>
          <Text style={styles.titleBold}>Was geht monatlich</Text>
          <Text style={styles.titleBold}>sicher weg?</Text>
          <Text style={styles.subtitle}>
            Miete, Abos oder Verträge – Luke reserviert diesen Betrag
            automatisch.
          </Text>
        </View>

        <View style={styles.chipsContainer}>
          {expenseTypes.map((type) => (
            <Chip
              key={type}
              label={type}
              selected={selectedType === type}
              onPress={() => setSelectedType(type)}
            />
          ))}
        </View>

        <View style={styles.inputContainer}>
          <CurrencyInput value={amount} onChangeText={setAmount} />
        </View>
      </KeyboardAwareScrollViewCompat>

      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Pressable
          onPress={handleComplete}
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
  inputContainer: {
    marginTop: "auto",
    paddingTop: Spacing["4xl"],
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
