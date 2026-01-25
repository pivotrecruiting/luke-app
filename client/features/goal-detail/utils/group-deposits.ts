import type { GoalDeposit } from "@/context/app/types";
import type { GroupedDepositsT } from "../types/goal-detail-types";
import { GERMAN_MONTHS } from "../constants/goal-detail-constants";
import { parseDepositDate } from "./date";

export const groupDepositsByMonth = (
  deposits: GoalDeposit[],
): GroupedDepositsT => {
  const grouped: GroupedDepositsT = {};

  const sortedDeposits = [...deposits].sort((a, b) => {
    const dateA = parseDepositDate(a.date)?.date || new Date();
    const dateB = parseDepositDate(b.date)?.date || new Date();
    return dateB.getTime() - dateA.getTime();
  });

  sortedDeposits.forEach((deposit) => {
    const parsed = parseDepositDate(deposit.date);
    if (parsed) {
      const key = `${GERMAN_MONTHS[parsed.month]} ${parsed.year}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(deposit);
    }
  });

  return grouped;
};
