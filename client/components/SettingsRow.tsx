import React from "react";
import { View, StyleSheet, Pressable, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Toggle } from "@/components/Toggle";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type SettingsRowAction =
  | { type: "text"; value: string }
  | { type: "button"; label: string; onPress?: () => void }
  | {
      type: "icon";
      iconName: keyof typeof Feather.glyphMap;
      onPress?: () => void;
    }
  | { type: "toggle"; value: boolean; onValueChange?: (value: boolean) => void }
  | { type: "none" };

type SettingsRowProps = {
  label: string;
  action?: SettingsRowAction;
  onPress?: () => void;
  showDivider?: boolean;
  style?: ViewStyle;
};

/**
 * Reusable settings row component that displays a label with various action types.
 */
export function SettingsRow({
  label,
  action,
  onPress,
  showDivider = true,
  style,
}: SettingsRowProps) {
  const { theme } = useTheme();

  const renderAction = () => {
    if (!action || action.type === "none") {
      return null;
    }

    switch (action.type) {
      case "text":
        return (
          <ThemedText type="small" style={styles.actionText}>
            {action.value}
          </ThemedText>
        );

      case "button":
        return (
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: theme.backgroundSecondary,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={action.onPress}
          >
            <ThemedText type="small" style={styles.actionButtonText}>
              {action.label}
            </ThemedText>
          </Pressable>
        );

      case "icon":
        return (
          <Pressable
            style={({ pressed }) => [
              styles.iconContainer,
              {
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={action.onPress}
          >
            <Feather
              name={action.iconName}
              size={16}
              color={theme.textSecondary}
            />
          </Pressable>
        );

      case "toggle":
        return (
          <Toggle value={action.value} onValueChange={action.onValueChange} />
        );

      default:
        return null;
    }
  };

  const content = (
    <View style={[styles.row, showDivider && styles.rowWithDivider, style]}>
      <ThemedText type="body" style={styles.label}>
        {label}
      </ThemedText>
      {renderAction()}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && { opacity: 0.7 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  rowWithDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  label: {
    flex: 1,
    color: "#000000",
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  actionButtonText: {
    fontWeight: "500",
    color: "#000000",
  },
  actionText: {
    color: "#000000",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
});
