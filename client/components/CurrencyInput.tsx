import React, { useMemo, useRef } from "react";
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  type StyleProp,
  type ViewStyle,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
  containerStyle?: StyleProp<ViewStyle>;
  /** Use "modal" for inputs inside modals (gray background, neutral border) */
  variant?: "default" | "modal";
  autoFocus?: boolean;
};

export default function CurrencyInput({
  value,
  onChangeText,
  placeholder,
  highlighted = true,
  currency,
  allowNegative = false,
  containerStyle,
  variant = "default",
  autoFocus = false,
}: CurrencyInputProps) {
  const { currency: appCurrency } = useApp();
  const inputAccessoryViewId = useRef(
    `currency-input-accessory-${Math.random().toString(36).slice(2, 10)}`,
  ).current;
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
    <>
      <View
        style={[
          styles.container,
          variant === "modal"
            ? styles.modal
            : highlighted
              ? styles.highlighted
              : styles.normal,
          containerStyle,
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
          autoFocus={autoFocus}
          inputAccessoryViewID={
            Platform.OS === "ios" ? inputAccessoryViewId : undefined
          }
          hitSlop={{
            top: Spacing.sm,
            bottom: Spacing.sm,
            left: Spacing["3xl"],
            right: Spacing.sm,
          }}
        />
      </View>
      {Platform.OS === "ios" ? (
        <InputAccessoryView nativeID={inputAccessoryViewId}>
          <View style={styles.accessoryContainer}>
            <Pressable
              style={styles.accessoryButton}
              onPress={() => Keyboard.dismiss()}
            >
              <Text style={styles.accessoryButtonText}>Fertig</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </>
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
  modal: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
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
  accessoryContainer: {
    alignItems: "flex-end",
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  accessoryButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
  },
  accessoryButtonText: {
    ...Typography.body,
    color: Colors.light.primary,
    fontWeight: "600",
  },
});
