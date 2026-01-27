import React, { useMemo } from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useApp, type CurrencyCode } from "@/context/AppContext";
import {
  formatCurrencyValue,
  getCurrencySeparators,
  getCurrencySymbol,
} from "@/utils/currency-format";

type CurrencyInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  highlighted?: boolean;
  currency?: CurrencyCode;
  allowNegative?: boolean;
};

export default function CurrencyInput({
  value,
  onChangeText,
  placeholder,
  highlighted = true,
  currency,
  allowNegative = false,
}: CurrencyInputProps) {
  const { currency: appCurrency } = useApp();
  const displayCurrency = currency ?? appCurrency;
  const currencySymbol = getCurrencySymbol(displayCurrency);
  const { decimalSeparator, thousandSeparator } = useMemo(
    () => getCurrencySeparators(displayCurrency),
    [displayCurrency],
  );
  const resolvedPlaceholder = useMemo(
    () => placeholder ?? `0${decimalSeparator}00`,
    [decimalSeparator, placeholder],
  );

  const normalizeInputValue = (input: string) => {
    const withoutGrouping = thousandSeparator
      ? input.split(thousandSeparator).join("")
      : input;
    const withDotSeparator =
      decimalSeparator && decimalSeparator !== "."
        ? withoutGrouping.split(decimalSeparator).join(".")
        : withoutGrouping;
    const stripped = allowNegative
      ? withDotSeparator.replace(/[^0-9.-]/g, "")
      : withDotSeparator.replace(/[^0-9.]/g, "");
    const normalizedMinus = allowNegative
      ? stripped.startsWith("-")
        ? `-${stripped.slice(1).replace(/-/g, "")}`
        : stripped.replace(/-/g, "")
      : stripped;
    const [integerPart, ...decimalParts] = normalizedMinus.split(".");
    const decimalPart = decimalParts.join("");
    const trimmedDecimal = decimalPart ? decimalPart.slice(0, 2) : "";
    const normalizedValue =
      decimalParts.length > 0
        ? `${integerPart}.${trimmedDecimal}`
        : integerPart;
    if (normalizedValue.startsWith(".")) {
      return `0${normalizedValue}`;
    }
    if (normalizedValue.startsWith("-.")) {
      return `-0${normalizedValue.slice(1)}`;
    }
    return normalizedValue;
  };

  const handleChange = (text: string) => {
    onChangeText(normalizeInputValue(text));
  };

  const formattedValue = useMemo(
    () => formatCurrencyValue(value, displayCurrency, { allowNegative }),
    [allowNegative, displayCurrency, value],
  );

  return (
    <View
      style={[
        styles.container,
        highlighted ? styles.highlighted : styles.normal,
      ]}
    >
      <Text style={styles.currency}>{currencySymbol}</Text>
      <TextInput
        style={styles.input}
        value={formattedValue}
        onChangeText={handleChange}
        placeholder={resolvedPlaceholder}
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
        hitSlop={{
          top: Spacing.sm,
          bottom: Spacing.sm,
          left: Spacing["3xl"],
          right: Spacing.sm,
        }}
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
    height: "100%",
    ...Typography.body,
    color: "#374151",
    padding: 0,
    textAlignVertical: "center",
    outlineStyle: "none",
  } as any,
});
