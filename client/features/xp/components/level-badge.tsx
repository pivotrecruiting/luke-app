import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import type { XpLevelT } from "@/types/xp-types";

type LevelBadgeProps = {
  level: XpLevelT;
};

/**
 * Displays a pill-shaped badge with gradient glow effect showing the level information.
 */
export const LevelBadge = ({ level }: LevelBadgeProps) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.9)", "rgba(115, 64, 253, 0.8)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={styles.badgeText}>
          Level {level.levelNumber}: {level.name}
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  gradient: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
});
