import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export default function Chip({ label, selected, onPress, style }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        pressed && styles.chipPressed,
        style,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    backgroundColor: Colors.light.chipBackground,
  },
  chipUnselected: {
    borderColor: Colors.light.chipBorder,
  },
  chipSelected: {
    borderColor: Colors.light.chipBorderSelected,
  },
  chipPressed: {
    opacity: 0.8,
  },
  label: {
    ...Typography.chip,
    color: "#4B5563",
  },
  labelSelected: {
    color: "#000000",
  },
});
