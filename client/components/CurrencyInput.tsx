import React from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useApp, type CurrencyCode } from "@/context/AppContext";

interface CurrencyInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  highlighted?: boolean;
  currency?: CurrencyCode;
}

export default function CurrencyInput({
  value,
  onChangeText,
  placeholder = "0,00",
  highlighted = true,
  currency,
}: CurrencyInputProps) {
  const { currency: appCurrency } = useApp();
  const displayCurrency = currency ?? appCurrency;
  const currencySymbol: Record<CurrencyCode, string> = {
    EUR: "€",
    USD: "$",
    CHF: "CHF",
  };
  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9,]/g, "");
    onChangeText(cleaned);
  };

  return (
    <View
      style={[
        styles.container,
        highlighted ? styles.highlighted : styles.normal,
      ]}
    >
      <Text style={styles.currency}>{currencySymbol[displayCurrency]}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    paddingHorizontal: Spacing.lg,
  },
  highlighted: {
    borderColor: Colors.light.inputBorder,
  },
  normal: {
    borderColor: Colors.light.inputBorderLight,
    borderWidth: 1,
  },
  currency: {
    ...Typography.body,
    color: "#6B7280",
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: "#374151",
    padding: 0,
    outlineStyle: "none",
  } as any,
});
