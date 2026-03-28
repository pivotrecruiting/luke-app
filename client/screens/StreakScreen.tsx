import React from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useApp } from "@/context/AppContext";
import { addDays, getLocalDateKey } from "@/features/xp/utils/dates";
import { startOfWeek } from "date-fns";
import { HeaderGradient } from "@/constants/theme";
import { StreakIcon } from "@/features/streak/components/streak-icon";
import { StreakXpDisplay } from "@/features/streak/components/streak-xp-display";
import { StreakProgressBar } from "@/features/streak/components/streak-progress-bar";
import { ContinueButton } from "@/features/xp/components/continue-button";
import { styles } from "./styles/streak-screen.styles";

const STREAK_DESCRIPTION_ONGOING =
  "Du musst nicht rennen, du darfst nur nicht stehen bleiben.";

const STREAK_DESCRIPTION_COMPLETED =
  "High Five! Eine perfekte Woche liegt hinter dir. Dein Fortschritt ist unaufhaltsam.";

type StreakScreenRouteParams = {
  xpGained?: number;
  variant?: "ongoing" | "completed";
};

/**
 * Screen that displays streak celebration with XP, progress circles and continue button.
 */
export default function StreakScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { userProgress, xpEventTypes } = useApp();

  const params = (route.params as StreakScreenRouteParams) || {};
  const currentStreak = userProgress?.currentStreak ?? 0;
  const lastStreakDate = userProgress?.lastStreakDate ?? null;
  const dailyLoginXp =
    xpEventTypes.find((eventType) => eventType.key === "daily_login")?.baseXp ??
    0;
  const streakBonusXp =
    xpEventTypes.find((eventType) => eventType.key === "streak_7_bonus")
      ?.baseXp ?? 0;

  const isCompleted =
    params.variant === "completed" ||
    (params.variant !== "ongoing" &&
      currentStreak >= 7 &&
      currentStreak % 7 === 0);

  const xpGained =
    params.xpGained ??
    (isCompleted ? dailyLoginXp + streakBonusXp : dailyLoginXp);
  const displayStreak = isCompleted && currentStreak < 7 ? 7 : currentStreak;
  const progressBarStreak =
    isCompleted && currentStreak < 7 ? 7 : currentStreak;
  const progressBarLastDate =
    isCompleted && (params.variant === "completed" || !lastStreakDate)
      ? getLocalDateKey(
          addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), 6),
        )
      : lastStreakDate;
  const streakTitle =
    displayStreak === 1 ? "1 Tag Streak" : `${displayStreak} Tage Streak`;
  const description = isCompleted
    ? STREAK_DESCRIPTION_COMPLETED
    : STREAK_DESCRIPTION_ONGOING;
  const buttonLabel = isCompleted ? "Auf zur nächsten Woche!" : "WEITER";

  const handleContinue = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={HeaderGradient.colors}
        start={HeaderGradient.start}
        end={HeaderGradient.end}
        style={styles.gradient}
      >
        <View
          style={[
            styles.contentWrapper,
            {
              paddingTop: insets.top + 60,
              paddingBottom: insets.bottom + 24,
            },
          ]}
        >
          <View style={styles.content}>
            <View style={styles.middleSection}>
              <View style={styles.iconContainer}>
                <StreakIcon variant={isCompleted ? "completed" : "ongoing"} />
              </View>

              <View style={styles.xpContainer}>
                <StreakXpDisplay title={streakTitle} xpGained={xpGained} />
              </View>

              <View style={styles.descriptionContainer}>
                <Text style={styles.description}>{description}</Text>
              </View>

              <View style={styles.streakBarContainer}>
                <StreakProgressBar
                  currentStreak={progressBarStreak}
                  lastStreakDate={progressBarLastDate}
                />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <ContinueButton onPress={handleContinue} label={buttonLabel} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
