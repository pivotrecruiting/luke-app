export type XpLevelT = {
  id: string;
  levelNumber: number;
  name: string;
  emoji: string;
  xpRequired: number;
};

export type XpEventTypeT = {
  id: string;
  key: string;
  label: string;
  baseXp: number;
  active: boolean;
  maxPerUser: number | null;
  cooldownHours: number | null;
};

export type XpRuleConditionT =
  | {
      type: "day_of_month";
      day: number;
    }
  | {
      type: string;
      [key: string]: unknown;
    };

export type XpEventRuleT = {
  id: string;
  eventTypeId: string;
  ruleKey: string;
  multiplier: number;
  conditions: XpRuleConditionT;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

export type UserProgressT = {
  id: string;
  userId: string;
  xpTotal: number;
  currentLevelId: string | null;
  currentStreak: number;
  longestStreak: number;
  lastLoginAt: string | null;
  lastStreakDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type XpAwardResultT = {
  xpDelta: number;
  appliedMultiplier: number;
  baseXp: number;
  nextTotal: number;
  nextLevelId: string | null;
};
