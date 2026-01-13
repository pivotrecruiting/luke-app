import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import { Feather } from "@expo/vector-icons";
import ProgressDots from "@/components/ProgressDots";
import Chip from "@/components/Chip";
import CurrencyInput from "@/components/CurrencyInput";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Typography, Colors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

interface Entry {
  type: string;
  amount: string;
}

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

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

export default function Onboarding5Screen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { setExpenseEntries } = useApp();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);

  const handleAddEntry = () => {
    if (selectedType && amount !== "") {
      setEntries((prev) => [...prev, { type: selectedType, amount }]);
      setSelectedType(null);
      setAmount("");
    }
  };

  const handleDeleteEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    const parsedEntries = entries.map((entry) => ({
      type: entry.type,
      amount: parseFloat(entry.amount.replace(",", ".")),
    }));
    setExpenseEntries(parsedEntries);
    navigation.navigate("Onboarding6");
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

        <Pressable
          onPress={handleAddEntry}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
        >
          <Text style={styles.addButtonText}>Hinzufügen</Text>
        </Pressable>

        {entries.length > 0 ? (
          <View style={styles.entriesContainer}>
            {entries.map((entry, index) => (
              <View key={index} style={styles.entryRow}>
                <View style={styles.entryIconContainer}>
                  <Feather name="trending-down" size={18} color="#EF4444" />
                </View>
                <View style={styles.entryContent}>
                  <Text style={styles.entryType}>{entry.type}</Text>
                  <Text style={styles.entryAmount}>{entry.amount} €</Text>
                </View>
                <Pressable 
                  style={styles.entryDeleteButton}
                  onPress={() => handleDeleteEntry(index)}
                >
                  <Feather name="x" size={18} color="#9CA3AF" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </KeyboardAwareScrollViewCompat>

      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Pressable
          onPress={handleContinue}
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
    marginTop: Spacing["3xl"],
  },
  addButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#7340FE",
    borderRadius: 12,
    height: Spacing.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7340FE",
  },
  entriesContainer: {
    marginTop: Spacing.xl,
    gap: 12,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  entryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  entryContent: {
    flex: 1,
  },
  entryType: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  entryAmount: {
    fontSize: 14,
    fontWeight: "500",
    color: "#EF4444",
  },
  entryDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
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
