import React, { useMemo } from "react";
import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useApp } from "@/context/AppContext";
import { getUserFirstName } from "@/utils/user";
import { resolveLevelByXp } from "@/features/xp/utils/levels";
import { LevelUpTitle } from "@/features/xp/components/level-up-title";
import { LevelUpDescription } from "@/features/xp/components/level-up-description";
import { LevelBadge } from "@/features/xp/components/level-badge";
import { LevelIcon } from "@/features/xp/components/level-icon";
import { XpProgressDisplay } from "@/features/xp/components/xp-progress-display";
import { ContinueButton } from "@/features/xp/components/continue-button";
import { styles } from "./styles/level-up-screen.styles";

type LevelUpScreenRouteParams = {
  levelId?: string;
  xpGained?: number;
};

/**
 * Screen that displays a celebration when the user levels up.
 */
export default function LevelUpScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { levels, userProgress, userName } = useApp();

  const params = (route.params as LevelUpScreenRouteParams) || {};
  const xpGained = params.xpGained ?? 100;
  const levelId = params.levelId;

  const { currentLevel, nextLevel, currentXp, nextLevelXp } = useMemo(() => {
    const sortedLevels = [...levels].sort(
      (a, b) => a.xpRequired - b.xpRequired,
    );
    const xpTotalValue = userProgress?.xpTotal ?? 0;
    const resolvedLevel = levelId
      ? sortedLevels.find((l) => l.id === levelId) ??
        resolveLevelByXp(sortedLevels, xpTotalValue)
      : resolveLevelByXp(sortedLevels, xpTotalValue);

    const current = resolvedLevel ?? sortedLevels[0] ?? null;
    if (!current) {
      return {
        currentLevel: null,
        nextLevel: null,
        currentXp: xpTotalValue,
        nextLevelXp: 0,
      };
    }

    const currentIndex = sortedLevels.findIndex((l) => l.id === current.id);
    const next =
      currentIndex >= 0 && currentIndex < sortedLevels.length - 1
        ? sortedLevels[currentIndex + 1]
        : null;

    const nextXp = next?.xpRequired ?? current.xpRequired;

    return {
      currentLevel: current,
      nextLevel: next,
      currentXp: xpTotalValue,
      nextLevelXp: nextXp,
    };
  }, [levels, userProgress, levelId]);

  const handleContinue = () => {
    navigation.goBack();
  };

  if (!currentLevel) {
    return null;
  }

  const firstName = getUserFirstName(userName);
  const displayName = firstName || "User";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          "rgba(115, 64, 253, 0.9)",
          "rgba(115, 64, 253, 0.7)",
          "rgba(115, 64, 253, 0.5)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.titleContainer}>
              <LevelUpTitle userName={displayName} />
            </View>

            <View style={styles.descriptionContainer}>
              <LevelUpDescription />
            </View>

            <View style={styles.badgeContainer}>
              <LevelBadge level={currentLevel} />
            </View>

            <View style={styles.iconContainer}>
              <LevelIcon emoji={currentLevel.emoji} />
            </View>

            <View style={styles.progressContainer}>
              <XpProgressDisplay
                xpGained={xpGained}
                currentXp={currentXp}
                nextLevelXp={nextLevelXp}
                currentLevel={currentLevel}
                nextLevel={nextLevel}
              />
            </View>

            <View style={styles.buttonContainer}>
              <ContinueButton onPress={handleContinue} />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
