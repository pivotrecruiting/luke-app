import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import {
  createXpEvent,
  fetchLatestXpEventAt,
  fetchXpConfig,
  fetchXpEventCount,
  getOrCreateUserProgress,
  updateUserProgress,
} from "@/services/app-service";
import type { UserProgressUpdatePayloadT } from "@/services/app-service";
import type {
  UserProgressT,
  XpEventRuleT,
  XpEventTypeT,
  XpLevelT,
} from "@/types/xp-types";
import { getHighestMultiplierForEvent } from "@/features/xp/utils/rules";
import { resolveLevelByXp } from "@/features/xp/utils/levels";
import { addDays, getLocalDateKey } from "@/features/xp/utils/dates";

type AwardXpParamsT = {
  eventKey: string;
  sourceType?: string | null;
  sourceId?: string | null;
  meta?: Record<string, unknown> | null;
  progressOverride?: UserProgressT | null;
  progressPatch?: UserProgressUpdatePayloadT;
  skipCooldownCheck?: boolean;
};

type UseXpParamsT = {
  userId: string | null;
  canUseDb: boolean;
};

/**
 * Manages XP state, rules, and awarding logic.
 */
export const useXp = ({ userId, canUseDb }: UseXpParamsT) => {
  const [levels, setLevels] = useState<XpLevelT[]>([]);
  const [xpEventTypes, setXpEventTypes] = useState<XpEventTypeT[]>([]);
  const [xpEventRules, setXpEventRules] = useState<XpEventRuleT[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgressT | null>(null);
  const userProgressRef = useRef<UserProgressT | null>(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    userProgressRef.current = userProgress;
  }, [userProgress]);

  const handleXpError = useCallback((error: unknown, context: string) => {
    console.error(`XP error during ${context}:`, error);
  }, []);

  const xpEventTypeByKey = useRef(new Map<string, XpEventTypeT>());
  useEffect(() => {
    const map = new Map<string, XpEventTypeT>();
    xpEventTypes.forEach((eventType) => {
      map.set(eventType.key, eventType);
    });
    xpEventTypeByKey.current = map;
  }, [xpEventTypes]);

  const clearXpState = useCallback(() => {
    setLevels([]);
    setXpEventTypes([]);
    setXpEventRules([]);
    setUserProgress(null);
  }, []);

  const loadXpForUser = useCallback(
    async (id: string) => {
      try {
        const xpConfig = await fetchXpConfig();
        setLevels(xpConfig.levels);
        setXpEventTypes(xpConfig.eventTypes);
        setXpEventRules(xpConfig.eventRules);
        try {
          const initialLevelId = xpConfig.levels[0]?.id ?? null;
          const progress = await getOrCreateUserProgress(id, initialLevelId);
          setUserProgress(progress);
        } catch (error) {
          handleXpError(error, "loadUserProgress");
          setUserProgress(null);
        }
      } catch (error) {
        handleXpError(error, "loadXpConfig");
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

      const eventType = xpEventTypeByKey.current.get(params.eventKey);
      if (!eventType || !eventType.active) return null;

      const baseProgress =
        params.progressOverride ?? userProgressRef.current ?? null;
      if (!baseProgress) return null;

      if (
        typeof eventType.maxPerUser === "number" &&
        eventType.maxPerUser > 0
      ) {
        try {
          const count = await fetchXpEventCount(
            userId,
            eventType.id,
            eventType.key,
          );
          if (count >= eventType.maxPerUser) return baseProgress;
        } catch (error) {
          handleXpError(error, "awardXp.maxPerUser");
          return baseProgress;
        }
      }

      if (
        !params.skipCooldownCheck &&
        typeof eventType.cooldownHours === "number" &&
        eventType.cooldownHours > 0
      ) {
        try {
          const lastEventAt = await fetchLatestXpEventAt(
            userId,
            eventType.id,
            eventType.key,
          );
          if (lastEventAt) {
            const lastDate = new Date(lastEventAt);
            const diffMs = Date.now() - lastDate.getTime();
            if (diffMs < eventType.cooldownHours * 60 * 60 * 1000) {
              return baseProgress;
            }
          }
        } catch (error) {
          handleXpError(error, "awardXp.cooldown");
          return baseProgress;
        }
      }

      const now = new Date();
      const appliedMultiplier = getHighestMultiplierForEvent(
        xpEventRules,
        eventType.id,
        now,
      );
      const baseXp = eventType.baseXp;
      const xpDelta = Math.round(baseXp * appliedMultiplier);
      if (!Number.isFinite(xpDelta) || xpDelta <= 0) {
        return baseProgress;
      }

      const nextTotal = baseProgress.xpTotal + xpDelta;
      const nextLevelId =
        resolveLevelByXp(levels, nextTotal)?.id ?? baseProgress.currentLevelId;

      try {
        await createXpEvent({
          userId,
          eventTypeId: eventType.id,
          eventTypeKey: eventType.key,
          baseXp,
          appliedMultiplier,
          xpDelta,
          sourceType: params.sourceType ?? null,
          sourceId: params.sourceId ?? null,
          meta: params.meta ?? null,
        });

        const updates: UserProgressUpdatePayloadT = {
          xp_total: nextTotal,
          current_level_id: nextLevelId,
          ...(params.progressPatch ?? {}),
        };
        const updated = await updateUserProgress(userId, updates);
        setUserProgress(updated);
        return updated;
      } catch (error) {
        handleXpError(error, "awardXp.persist");
        return baseProgress;
      }
    },
    [canUseDb, levels, userId, xpEventRules, handleXpError],
  );

  const handleDailyLogin = useCallback(async () => {
    if (!canUseDb || !userId) return;
    const progress = userProgressRef.current;
    if (!progress) return;

    const now = new Date();
    const todayKey = getLocalDateKey(now);
    if (progress.lastStreakDate === todayKey) return;

    const yesterdayKey = getLocalDateKey(addDays(now, -1));
    const isContinuing = progress.lastStreakDate === yesterdayKey;
    const nextStreak = isContinuing ? progress.currentStreak + 1 : 1;
    const nextLongest = Math.max(progress.longestStreak, nextStreak);

    const updatedProgress = await awardXp({
      eventKey: "daily_login",
      progressPatch: {
        last_login_at: now.toISOString(),
        last_streak_date: todayKey,
        current_streak: nextStreak,
        longest_streak: nextLongest,
      },
      skipCooldownCheck: true,
      meta: { date: todayKey },
    });

    if (updatedProgress && nextStreak % 7 === 0) {
      await awardXp({
        eventKey: "streak_7_bonus",
        progressOverride: updatedProgress,
        meta: { streak: nextStreak },
      });
    }
  }, [awardXp, canUseDb, userId]);

  useEffect(() => {
    if (!canUseDb || !userProgress) return;
    void handleDailyLogin();
  }, [canUseDb, handleDailyLogin, userProgress]);

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
