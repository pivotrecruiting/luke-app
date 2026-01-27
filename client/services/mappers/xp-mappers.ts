import type {
  LevelRow,
  UserProgressRow,
  XpEventRuleRow,
  XpEventTypeRow,
} from "@/services/types";
import type {
  UserProgressT,
  XpEventRuleT,
  XpEventTypeT,
  XpLevelT,
  XpRuleConditionT,
} from "@/types/xp-types";

const parseMultiplier = (value: number | string): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 1;
};

export const mapLevels = (rows: LevelRow[]): XpLevelT[] =>
  rows.map((row) => ({
    id: row.id,
    levelNumber: row.level_number,
    name: row.name,
    description: row.description,
    emoji: row.emoji,
    xpRequired: row.xp_required,
  }));

export const mapXpEventTypes = (rows: XpEventTypeRow[]): XpEventTypeT[] =>
  rows.map((row) => ({
    id: row.id,
    key: row.key,
    label: row.label,
    baseXp: row.base_xp,
    active: row.active,
    maxPerUser: row.max_per_user ?? null,
    cooldownHours: row.cooldown_hours ?? null,
  }));

export const mapXpEventRules = (rows: XpEventRuleRow[]): XpEventRuleT[] =>
  rows.map((row) => ({
    id: row.id,
    eventTypeId: row.event_type_id,
    ruleKey: row.rule_key,
    multiplier: parseMultiplier(row.multiplier),
    conditions: (row.conditions ?? {}) as XpRuleConditionT,
    active: row.active,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  }));

export const mapUserProgress = (row: UserProgressRow): UserProgressT => ({
  id: row.id,
  userId: row.user_id,
  xpTotal: row.xp_total,
  currentLevelId: row.current_level_id,
  currentStreak: row.current_streak,
  longestStreak: row.longest_streak,
  lastLoginAt: row.last_login_at,
  lastStreakDate: row.last_streak_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
