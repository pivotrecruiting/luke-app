import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import {
  applyDailyLoginXp,
  awardXpEvent,
  fetchXpState,
} from "@/services/app-service";
import type {
  UserProgressT,
  XpStreakPayloadT,
  XpEventTypeT,
  XpLevelT,
  XpEventRuleT,
  XpLevelUpPayloadT,
} from "@/types/xp-types";

type AwardXpParamsT = {
  eventKey: string;
  sourceType?: string | null;
  sourceId?: string | null;
  meta?: Record<string, unknown> | null;
  progressOverride?: UserProgressT | null;
};

type UseXpParamsT = {
  userId: string | null;
  canUseDb: boolean;
  onLevelUp?: (payload: XpLevelUpPayloadT) => void;
  onStreakReached?: (payload: XpStreakPayloadT) => void;
};

/**
 * Manages XP state, rules, and awarding logic.
 */
export const useXp = ({
  userId,
  canUseDb,
  onLevelUp,
  onStreakReached,
}: UseXpParamsT) => {
  const [levels, setLevels] = useState<XpLevelT[]>([]);
  const [xpEventTypes, setXpEventTypes] = useState<XpEventTypeT[]>([]);
  const [xpEventRules, setXpEventRules] = useState<XpEventRuleT[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgressT | null>(null);
  const userProgressRef = useRef<UserProgressT | null>(null);
  const onLevelUpRef = useRef<((payload: XpLevelUpPayloadT) => void) | null>(
    onLevelUp ?? null,
  );
  const onStreakReachedRef = useRef<
    ((payload: XpStreakPayloadT) => void) | null
  >(onStreakReached ?? null);
  const appStateRef = useRef(AppState.currentState);
  const isDailyLoginInFlightRef = useRef(false);
  const lastDailyLoginKeyRef = useRef<string | null>(null);

  useEffect(() => {
    userProgressRef.current = userProgress;
  }, [userProgress]);

  useEffect(() => {
    onLevelUpRef.current = onLevelUp ?? null;
  }, [onLevelUp]);

  useEffect(() => {
    onStreakReachedRef.current = onStreakReached ?? null;
  }, [onStreakReached]);

  const handleXpError = useCallback((error: unknown, context: string) => {
    console.error(`XP error during ${context}:`, error);
  }, []);

  const clearXpState = useCallback(() => {
    setLevels([]);
    setXpEventTypes([]);
    setXpEventRules([]);
    setUserProgress(null);
  }, []);

  const loadXpForUser = useCallback(
    async (id: string) => {
      void id;

      try {
        const xpState = await fetchXpState();
        setLevels(xpState.levels);
        setXpEventTypes(xpState.eventTypes);
        setXpEventRules(xpState.eventRules);
        setUserProgress(xpState.userProgress);
      } catch (error) {
        handleXpError(error, "loadXpState");
        clearXpState();
      }
    },
    [clearXpState, handleXpError],
  );

  useEffect(() => {
    if (!canUseDb || !userId) {
      clearXpState();
      return;
    }
    void loadXpForUser(userId);
  }, [canUseDb, clearXpState, loadXpForUser, userId]);

  const awardXp = useCallback(
    async (params: AwardXpParamsT): Promise<UserProgressT | null> => {
      if (!canUseDb || !userId) return null;

      const baseProgress =
        params.progressOverride ?? userProgressRef.current ?? null;
      if (!baseProgress) return null;

      try {
        const result = await awardXpEvent({
          eventKey: params.eventKey,
          sourceType: params.sourceType ?? null,
          sourceId: params.sourceId ?? null,
          meta: params.meta ?? null,
        });

        const updated = result.userProgress;
        if (!updated) {
          return baseProgress;
        }

        setUserProgress(updated);
        if (
          result.awarded &&
          updated.currentLevelId &&
          updated.currentLevelId !== baseProgress.currentLevelId
        ) {
          onLevelUpRef.current?.({
            levelId: updated.currentLevelId,
            xpGained: result.xpDelta,
          });
        }
        return updated;
      } catch (error) {
        handleXpError(error, "awardXp.persist");
        return baseProgress;
      }
    },
    [canUseDb, userId, handleXpError],
  );

  const handleDailyLogin = useCallback(async () => {
    if (!canUseDb || !userId) return;

    const dailyLoginKey = `${userId}:${new Date().toISOString().slice(0, 10)}`;

    if (
      isDailyLoginInFlightRef.current ||
      lastDailyLoginKeyRef.current === dailyLoginKey
    ) {
      return;
    }

    const previousProgress = userProgressRef.current;
    isDailyLoginInFlightRef.current = true;

    try {
      const result = await applyDailyLoginXp();
      const updatedProgress = result.userProgress;
      lastDailyLoginKeyRef.current = dailyLoginKey;

      if (!updatedProgress) {
        return;
      }

      setUserProgress(updatedProgress);

      if (
        result.awarded &&
        updatedProgress.currentLevelId &&
        updatedProgress.currentLevelId !== previousProgress?.currentLevelId
      ) {
        onLevelUpRef.current?.({
          levelId: updatedProgress.currentLevelId,
          xpGained: result.xpDelta,
        });
      }

      if (result.awarded && result.streakVariant) {
        onStreakReachedRef.current?.({
          xpGained: result.xpDelta,
          variant: result.streakVariant,
        });
      }
    } catch (error) {
      handleXpError(error, "dailyLogin");
    } finally {
      isDailyLoginInFlightRef.current = false;
    }
  }, [canUseDb, userId, handleXpError]);

  useEffect(() => {
    if (!canUseDb || !userId) return;
    void handleDailyLogin();
  }, [canUseDb, handleDailyLogin, userId]);

  useEffect(() => {
    if (userId) {
      return;
    }

    isDailyLoginInFlightRef.current = false;
    lastDailyLoginKeyRef.current = null;
  }, [userId]);

  useEffect(() => {
    if (!canUseDb) return;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current !== "active" && nextState === "active") {
        void handleDailyLogin();
      }
      appStateRef.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [canUseDb, handleDailyLogin]);

  return {
    levels,
    xpEventTypes,
    xpEventRules,
    userProgress,
    awardXp,
    loadXpForUser,
    clearXpState,
  };
};
