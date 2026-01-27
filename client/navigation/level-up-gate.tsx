import React, { useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { navigationRef } from "@/navigation/navigation-ref";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type LevelUpGateProps = {
  currentRouteName: keyof RootStackParamList | null;
};

/**
 * Navigates to the LevelUp screen when a queued level-up is ready to be shown.
 */
export const LevelUpGate = ({ currentRouteName }: LevelUpGateProps) => {
  const {
    pendingLevelUps,
    consumeNextLevelUp,
    isOnboardingComplete,
    isAppLoading,
  } = useApp();
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    if (currentRouteName === "LevelUp") {
      isNavigatingRef.current = false;
      return;
    }
    if (isNavigatingRef.current) return;
    if (isAppLoading || !isOnboardingComplete) return;
    if (!navigationRef.isReady()) return;

    const nextLevelUp = pendingLevelUps[0];
    if (!nextLevelUp) return;

    isNavigatingRef.current = true;
    consumeNextLevelUp();
    navigationRef.navigate("LevelUp", nextLevelUp);
  }, [
    consumeNextLevelUp,
    currentRouteName,
    isAppLoading,
    isOnboardingComplete,
    pendingLevelUps,
  ]);

  return null;
};
