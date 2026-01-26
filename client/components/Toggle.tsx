import React from "react";
import { Switch, StyleSheet, Platform } from "react-native";
import { useTheme } from "@/hooks/useTheme";

type ToggleProps = {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
};

/**
 * Toggle switch component for settings and notifications.
 */
export function Toggle({
  value,
  onValueChange,
  disabled = false,
}: ToggleProps) {
  const { theme } = useTheme();

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{
        false: theme.backgroundTertiary,
        true: theme.primary,
      }}
      thumbColor={Platform.select({
        ios: "#FFFFFF",
        android: value ? "#FFFFFF" : "#F4F3F4",
      })}
      ios_backgroundColor={theme.backgroundTertiary}
    />
  );
}
