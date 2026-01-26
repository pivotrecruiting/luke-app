import { Text, View } from "react-native";
import { useMemo } from "react";
import { styles } from "@/screens/styles/goals-screen.styles";
import { useApp } from "@/context/AppContext";
import { resolveLevelByXp } from "@/features/xp/utils/levels";

/**
 * Displays the current level progress card.
 */
export const LevelCard = () => {
  const { levels, userProgress } = useApp();

  const {
    currentLevel,
    nextLevel,
    xpTotal,
    xpToNextLevel,
    progress,
  } = useMemo(() => {
    const sortedLevels = [...levels].sort(
      (a, b) => a.xpRequired - b.xpRequired,
    );
    const xpTotalValue = userProgress?.xpTotal ?? 0;
    const resolvedLevel =
      resolveLevelByXp(sortedLevels, xpTotalValue) ?? sortedLevels[0] ?? null;
    const currentIndex = resolvedLevel
      ? sortedLevels.findIndex((level) => level.id === resolvedLevel.id)
      : -1;
    const next =
      currentIndex >= 0 && currentIndex < sortedLevels.length - 1
        ? sortedLevels[currentIndex + 1]
        : null;
    const baseXp = resolvedLevel?.xpRequired ?? 0;
    const nextXp = next?.xpRequired ?? baseXp;
    const span = Math.max(1, nextXp - baseXp);
    const filled = Math.max(0, xpTotalValue - baseXp);
    const progressValue = next ? Math.min(1, filled / span) : 1;
    const remaining = next ? Math.max(0, nextXp - xpTotalValue) : 0;

    return {
      currentLevel: resolvedLevel,
      nextLevel: next,
      xpTotal: xpTotalValue,
      xpToNextLevel: remaining,
      progress: progressValue,
    };
  }, [levels, userProgress]);

  return (
    <View style={styles.levelCard}>
      <View style={styles.levelHeader}>
        <View style={styles.levelLeft}>
          <Text style={styles.foxEmoji}>{currentLevel?.emoji ?? "⭐"}</Text>
          <View>
            <Text style={styles.levelTitle}>
              Level {currentLevel?.levelNumber ?? 1}
            </Text>
            <Text style={styles.levelName}>
              {currentLevel?.name ?? "Level"}
            </Text>
          </View>
        </View>
        <Text style={styles.xpText}>{xpTotal} XP</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.xpLabels}>
        <Text style={styles.xpLabel}>{xpTotal} XP</Text>
        {nextLevel ? (
          <Text style={styles.xpLabel}>
            {xpToNextLevel} XP bis Level {nextLevel.levelNumber}
          </Text>
        ) : (
          <Text style={styles.xpLabel}>Max Level erreicht</Text>
        )}
      </View>
    </View>
  );
};
