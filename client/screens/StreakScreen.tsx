import React from "react";
import { View, ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useApp } from "@/context/AppContext";
import { StreakIcon } from "@/features/streak/components/streak-icon";
import { StreakXpDisplay } from "@/features/streak/components/streak-xp-display";
import { StreakProgressBar } from "@/features/streak/components/streak-progress-bar";
import { ContinueButton } from "@/features/xp/components/continue-button";
import { styles } from "./styles/streak-screen.styles";

const STREAK_DESCRIPTION =
  "Du musst nicht rennen, du darfst nur nicht stehen bleiben.";

type StreakScreenRouteParams = {
  xpGained?: number;
};

/**
 * Screen that displays streak celebration with XP, progress circles and continue button.
 */
export default function StreakScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { userProgress } = useApp();

  const params = (route.params as StreakScreenRouteParams) || {};
  const xpGained = params.xpGained ?? 0;

  const currentStreak = userProgress?.currentStreak ?? 0;
  const lastStreakDate = userProgress?.lastStreakDate ?? null;

  const streakTitle =
    currentStreak === 1 ? "1 Tag Streak" : `${currentStreak} Tage Streak`;

  const handleContinue = () => {
    navigation.goBack();
  };

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
            <View style={styles.middleSection}>
              <View style={styles.iconContainer}>
                <StreakIcon />
              </View>

              <View style={styles.xpContainer}>
                <StreakXpDisplay title={streakTitle} xpGained={xpGained} />
              </View>

              <View style={styles.descriptionContainer}>
                <Text style={styles.description}>{STREAK_DESCRIPTION}</Text>
              </View>

              <View style={styles.streakBarContainer}>
                <StreakProgressBar
                  currentStreak={currentStreak}
                  lastStreakDate={lastStreakDate}
                />
              </View>
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
