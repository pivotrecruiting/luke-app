import { parseFormattedDate } from "@/utils/dates";
import type { Transaction } from "@/context/app/types";
import { getDateRangeForFilter } from "./date";
import type {
  PeriodIncomeExpensesT,
  TimeFilterT,
} from "../types/insights-types";

type PeriodBoundsT = {
  start: Date;
  end: Date;
  label: string;
};

/**
 * Returns period bounds for a given time filter.
 * For single months (thisMonth, lastMonth): 6 steps of ~5 days each.
 * For multi-month filters: one step per month (3, 6, or 6 for thisYear).
 */
export const getPeriodsForTimeFilter = (
  filter: TimeFilterT,
): PeriodBoundsT[] => {
  const { start: rangeStart, end: rangeEnd } = getDateRangeForFilter(filter);

  switch (filter) {
    case "thisMonth":
    case "lastMonth": {
      const year = rangeStart.getFullYear();
      const month = rangeStart.getMonth();
      const lastDay = rangeEnd.getDate();
      const periods: PeriodBoundsT[] = [];
      const dayRanges = [
        [1, 5],
        [6, 10],
        [11, 15],
        [16, 20],
        [21, 25],
        [26, lastDay],
      ];

      for (const [from, to] of dayRanges) {
        periods.push({
          start: new Date(year, month, from, 0, 0, 0),
          end: new Date(year, month, to, 23, 59, 59),
          label: String(to),
        });
      }
      return periods;
    }
    case "last3Months": {
      const periods: PeriodBoundsT[] = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date(rangeStart);
        d.setMonth(d.getMonth() + i);
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(
          d.getFullYear(),
          d.getMonth() + 1,
          0,
          23,
          59,
          59,
        );
        periods.push({
          start: monthStart,
          end: monthEnd,
          label: monthStart.toLocaleDateString("de-DE", {
            month: "short",
            year: "2-digit",
          }),
        });
      }
      return periods;
    }
    case "last6Months": {
      const periods: PeriodBoundsT[] = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(rangeStart);
        d.setMonth(d.getMonth() + i);
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(
          d.getFullYear(),
          d.getMonth() + 1,
          0,
          23,
          59,
          59,
        );
        periods.push({
          start: monthStart,
          end: monthEnd,
          label: monthStart.toLocaleDateString("de-DE", {
            month: "short",
            year: "2-digit",
          }),
        });
      }
      return periods;
    }
    case "thisYear": {
      const periods: PeriodBoundsT[] = [];
      const blockMonths = 2;
      for (let i = 0; i < 6; i++) {
        const startMonth = i * blockMonths;
        const endMonth = Math.min(startMonth + blockMonths, 12) - 1;
        const start = new Date(rangeStart.getFullYear(), startMonth, 1);
        const end = new Date(
          rangeStart.getFullYear(),
          endMonth + 1,
          0,
          23,
          59,
          59,
        );
        periods.push({
          start,
          end,
          label: start.toLocaleDateString("de-DE", {
            month: "short",
          }),
        });
      }
      return periods;
    }
    default:
      return [];
  }
};

/**
 * Aggregates transactions into per-period income and expenses.
 */
export const aggregateByPeriods = (
  transactions: Transaction[],
  periods: PeriodBoundsT[],
): PeriodIncomeExpensesT[] => {
  return periods.map((period) => {
    let income = 0;
    let expenses = 0;

    for (const tx of transactions) {
      const txDate = tx.timestamp
        ? new Date(tx.timestamp)
        : parseFormattedDate(tx.date);
      if (txDate < period.start || txDate > period.end) continue;

      if (tx.amount >= 0) {
        income += tx.amount;
      } else {
        expenses += Math.abs(tx.amount);
      }
    }

    return {
      label: period.label,
      income,
      expenses,
    };
  });
};
