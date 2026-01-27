import type { Transaction, WeeklySpending } from "@/context/app/types";
import { formatWeekLabel } from "@/utils/dates";
import { calculateWeeklySpending } from "@/utils/weekly-spending";

export const getWeeklySpending = (
  transactions: Transaction[],
  selectedWeekOffset: number,
): WeeklySpending[] =>
  calculateWeeklySpending(transactions, selectedWeekOffset);

export const getCurrentWeekLabel = (selectedWeekOffset: number): string =>
  formatWeekLabel(selectedWeekOffset);
