import type { XpEventRuleT, XpRuleConditionT } from "@/types/xp-types";

const isWithinDateRange = (rule: XpEventRuleT, now: Date): boolean => {
  if (rule.startsAt) {
    const startsAt = new Date(rule.startsAt);
    if (Number.isNaN(startsAt.getTime()) || now < startsAt) return false;
  }
  if (rule.endsAt) {
    const endsAt = new Date(rule.endsAt);
    if (Number.isNaN(endsAt.getTime()) || now > endsAt) return false;
  }
  return true;
};

const matchesCondition = (conditions: XpRuleConditionT, now: Date): boolean => {
  if (!conditions || typeof conditions !== "object") return false;
  if (conditions.type === "day_of_month") {
    const day =
      typeof conditions.day === "number"
        ? conditions.day
        : Number(conditions.day);
    return Number.isFinite(day) && now.getDate() === day;
  }
  return false;
};

export const getHighestMultiplierForEvent = (
  rules: XpEventRuleT[],
  eventTypeId: string,
  now: Date,
): number => {
  let highest = 1;
  rules.forEach((rule) => {
    if (!rule.active) return;
    if (rule.eventTypeId !== eventTypeId) return;
    if (!isWithinDateRange(rule, now)) return;
    if (!matchesCondition(rule.conditions, now)) return;
    const multiplier = Number(rule.multiplier);
    if (Number.isFinite(multiplier) && multiplier > highest) {
      highest = multiplier;
    }
  });
  return Math.max(1, highest);
};
