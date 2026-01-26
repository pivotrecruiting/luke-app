import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import type { XpLevelT } from "@/types/xp-types";

type XpProgressDisplayProps = {
  xpGained: number;
  currentXp: number;
  nextLevelXp: number;
  currentLevel: XpLevelT;
  nextLevel: XpLevelT | null;
};

/**
 * Displays XP gained, progress bar, and progress text towards next level.
 */
export const XpProgressDisplay = ({
  xpGained,
  currentXp,
  nextLevelXp,
  currentLevel,
  nextLevel,
}: XpProgressDisplayProps) => {
  const progress = useMemo(() => {
    if (!nextLevel) return 1;
    const baseXp = currentLevel.xpRequired;
    const span = Math.max(1, nextLevelXp - baseXp);
    const filled = Math.max(0, currentXp - baseXp);
    return Math.min(1, filled / span);
  }, [currentXp, nextLevelXp, currentLevel, nextLevel]);

  return (
    <View style={styles.container}>
      <Text style={styles.xpGained}>+{xpGained} XP</Text>
      <View style={styles.progressBarContainer}>
        <View
          style={[styles.progressBar, { width: `${progress * 100}%` }]}
        />
      </View>
      <Text style={styles.progressText}>
        {currentXp} / {nextLevelXp} bis Level {nextLevel?.levelNumber ?? "?"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  xpGained: {
    ...Typography.h3,
    color: "#FFFFFF",
    marginBottom: Spacing.md,
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xs,
  },
  progressText: {
    ...Typography.small,
    color: "#FFFFFF",
  },
});
