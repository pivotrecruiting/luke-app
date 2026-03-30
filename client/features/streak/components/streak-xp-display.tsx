import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Typography, Spacing } from "@/constants/theme";

type StreakXpDisplayProps = {
  title: string;
  xpGained: number;
};

/**
 * Displays the streak title and XP gained without a progress bar.
 */
export const StreakXpDisplay = ({ title, xpGained }: StreakXpDisplayProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title} 🔥</Text>
      <Text style={styles.xpGained}>+{xpGained} XP</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    ...Typography.h2,
    color: "#FFFFFF",
    marginBottom: Spacing.sm,
  },
  xpGained: {
    ...Typography.h3,
    color: "#FFFFFF",
  },
});
