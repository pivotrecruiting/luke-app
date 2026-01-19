import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/theme";
import { useApp, type CurrencyCode } from "@/context/AppContext";

const CURRENCIES: Array<{ code: CurrencyCode; label: string; description: string }> = [
  { code: "EUR", label: "Euro", description: "Euro (EUR)" },
  { code: "USD", label: "US Dollar", description: "US Dollar (USD)" },
  { code: "CHF", label: "Schweizer Franken", description: "Schweizer Franken (CHF)" },
];

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

export default function OnboardingCurrencyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { currency, setCurrency } = useApp();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(currency);

  const handleContinue = () => {
    setCurrency(selectedCurrency);
    navigation.navigate("Onboarding1");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      <View style={styles.headerContainer}>
        <Text style={styles.titleBold}>Welche Währung nutzt du?</Text>
        <Text style={styles.subtitle}>
          Wähle deine Standardwährung.
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {CURRENCIES.map((item) => {
          const isSelected = selectedCurrency === item.code;
          return (
            <Pressable
              key={item.code}
              onPress={() => setSelectedCurrency(item.code)}
              style={({ pressed }) => [
                styles.optionCard,
                isSelected && styles.optionCardSelected,
                pressed && styles.optionCardPressed,
              ]}
            >
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionLabel}>{item.label}</Text>
                <Text style={styles.optionDescription}>{item.description}</Text>
              </View>
              <View style={[styles.radio, isSelected && styles.radioSelected]} />
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
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
  optionsContainer: {
    marginTop: Spacing["3xl"],
    gap: Spacing.md,
  },
  optionCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.inputBorderLight,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  optionCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: "#F4F0FF",
  },
  optionCardPressed: {
    opacity: 0.85,
  },
  optionTextContainer: {
    gap: Spacing.xs,
  },
  optionLabel: {
    ...Typography.h4,
    color: Colors.light.text,
  },
  optionDescription: {
    ...Typography.small,
    color: Colors.light.textSecondary,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.light.inputBorderLight,
  },
  radioSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  buttonContainer: {
    marginTop: "auto",
    paddingTop: Spacing.md,
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
