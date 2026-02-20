import { useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { navigationRef } from "@/navigation/navigation-ref";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type StreakGateProps = {
  currentRouteName: keyof RootStackParamList | null;
};

/**
 * Navigates to the streak screen when a queued daily streak payload is ready.
 */
export const StreakGate = ({ currentRouteName }: StreakGateProps) => {
  const {
    pendingStreaks,
    consumeNextStreak,
    isOnboardingComplete,
    isAppLoading,
  } = useApp();
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    if (currentRouteName === "Streak") {
      isNavigatingRef.current = false;
      return;
    }
    if (isNavigatingRef.current) return;
    if (isAppLoading || !isOnboardingComplete) return;
    if (!navigationRef.isReady()) return;
    if (currentRouteName === "LevelUp") return;

    const nextStreak = pendingStreaks[0];
    if (!nextStreak) return;

    isNavigatingRef.current = true;
    consumeNextStreak();
    navigationRef.navigate("Streak", nextStreak);
  }, [
    consumeNextStreak,
    currentRouteName,
    isAppLoading,
    isOnboardingComplete,
    pendingStreaks,
  ]);

  return null;
};
