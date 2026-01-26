import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import type { XpLevelT } from "@/types/xp-types";

type LevelBadgeProps = {
  level: XpLevelT;
};

/**
 * Displays a pill-shaped badge with white background and glow effect showing the level information.
 */
export const LevelBadge = ({ level }: LevelBadgeProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          Level {level.levelNumber}: {level.name}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.full,
    overflow: "visible",
    marginTop: Spacing.sm,
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 0,
  },
  badgeText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
});
