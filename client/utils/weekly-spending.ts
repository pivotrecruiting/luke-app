import type { Transaction, WeeklySpending } from "@/context/app/types";
import { getWeekBounds, parseFormattedDate } from "@/utils/dates";

export const calculateWeeklySpending = (
  transactions: Transaction[],
  weekOffset: number,
): WeeklySpending[] => {
  const { start, end } = getWeekBounds(weekOffset);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dailyAmounts = [0, 0, 0, 0, 0, 0, 0];

  transactions.forEach((tx) => {
    if (tx.amount >= 0) return;

    const txDate = parseFormattedDate(tx.date);
    if (txDate >= start && txDate <= end) {
      const dayIndex = txDate.getDay() === 0 ? 6 : txDate.getDay() - 1;
      dailyAmounts[dayIndex] += Math.abs(tx.amount);
    }
  });

  const maxAmount = Math.max(...dailyAmounts, 1);

  return days.map((day, index) => ({
    day,
    amount: Math.round(dailyAmounts[index] * 100) / 100,
    maxAmount,
  }));
};
