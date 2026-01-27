import React from "react";
import { Switch, StyleSheet, Platform, View } from "react-native";
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
    <View style={styles.container}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: theme.backgroundSecondary,
          true: theme.accent,
        }}
        thumbColor={Platform.select({
          ios: "#FFFFFF",
          android: value ? "#FFFFFF" : "#F4F3F4",
        })}
        ios_backgroundColor={theme.backgroundSecondary}
        style={styles.switch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 52,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  switch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
});
