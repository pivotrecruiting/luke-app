import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Spacing } from "@/constants/theme";

type LevelIconProps = {
  emoji: string;
};

/**
 * Displays a large emoji icon with decorative star icons on the sides.
 */
export const LevelIcon = ({ emoji }: LevelIconProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.star}>⭐</Text>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.star}>⭐</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  emoji: {
    fontSize: 80,
  },
  star: {
    fontSize: 24,
  },
});
