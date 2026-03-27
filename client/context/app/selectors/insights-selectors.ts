import type {
  Budget,
  ExpenseEntry,
  InsightCategory,
  MonthlyBalanceSnapshotT,
  MonthlyTrendData,
  Transaction,
  VaultTransactionT,
} from "@/context/app/types";
import { CATEGORY_COLORS, GERMAN_MONTHS_SHORT } from "@/context/app/constants";
import { parseFormattedDate } from "@/utils/dates";

export const getInsightCategories = (
  budgets: Budget[],
  expenseEntries: ExpenseEntry[],
): InsightCategory[] => {
  const categories: Record<string, number> = {};
  const colorsByName: Record<string, string> = {};

  budgets.forEach((budget) => {
    const categoryName = budget.name;
    categories[categoryName] = (categories[categoryName] || 0) + budget.current;
    if (colorsByName[categoryName] === undefined) {
      colorsByName[categoryName] = budget.iconColor;
    }
  });

  const fixedCategories: Record<string, string[]> = {
    Wohnen: ["Wohnen", "Miete"],
    Abonnements: ["Netflix", "Spotify", "Handy", "Disney+", "Amazon Prime"],
  };

  expenseEntries.forEach((entry) => {
    let matched = false;
    for (const [category, keywords] of Object.entries(fixedCategories)) {
      if (keywords.some((keyword) => entry.type.includes(keyword))) {
        categories[category] = (categories[category] || 0) + entry.amount;
        if (colorsByName[category] === undefined) {
          colorsByName[category] = CATEGORY_COLORS[category] || "#6B7280";
        }
        matched = true;
        break;
      }
    }
    if (!matched) {
      categories["Sonstiges"] = (categories["Sonstiges"] || 0) + entry.amount;
      if (colorsByName["Sonstiges"] === undefined) {
        colorsByName["Sonstiges"] = CATEGORY_COLORS["Sonstiges"] || "#6B7280";
      }
    }
  });

  return Object.entries(categories)
    .filter(([_, amount]) => amount > 0)
    .map(([name, amount]) => ({
      name,
      amount,
      color: colorsByName[name] || CATEGORY_COLORS[name] || "#6B7280",
    }))
    .sort((a, b) => b.amount - a.amount);
};

const padMonthNumber = (value: number): string =>
  value.toString().padStart(2, "0");

const toMonthStart = (date: Date): string =>
  `${date.getFullYear()}-${padMonthNumber(date.getMonth() + 1)}-01`;

const parseMonthStart = (monthStart: string): Date => {
  const [year, month, day] = monthStart.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0);
};

const getRecentMonthStarts = (
  monthsBack: number,
  referenceDate: Date,
): string[] => {
  const currentMonthDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    1,
    12,
    0,
    0,
    0,
  );

  return Array.from({ length: Math.max(monthsBack, 1) }, (_, index) => {
    const monthDate = new Date(currentMonthDate);
    monthDate.setMonth(currentMonthDate.getMonth() - (monthsBack - 1 - index));
    return toMonthStart(monthDate);
  });
};

export const getMonthlyTrendData = (
  transactions: Transaction[],
  vaultTransactions: VaultTransactionT[],
  monthlyBalanceSnapshots: MonthlyBalanceSnapshotT[],
  monthsBack = 12,
  referenceDate = new Date(),
): MonthlyTrendData[] => {
  const transactionBalanceByMonth = new Map<string, number>();
  const manualDepositsByMonth = new Map<string, number>();
  const snapshotByMonth = new Map<string, number>();

  transactions.forEach((transaction) => {
    const transactionDate = transaction.timestamp
      ? new Date(transaction.timestamp)
      : parseFormattedDate(transaction.date);
    const monthStart = toMonthStart(transactionDate);
    transactionBalanceByMonth.set(
      monthStart,
      (transactionBalanceByMonth.get(monthStart) ?? 0) + transaction.amount,
    );
  });

  vaultTransactions.forEach((entry) => {
    if (entry.entryType !== "manual_deposit") return;
    const monthStart = toMonthStart(new Date(entry.transactionAt));
    manualDepositsByMonth.set(
      monthStart,
      (manualDepositsByMonth.get(monthStart) ?? 0) + entry.amount,
    );
  });

  monthlyBalanceSnapshots.forEach((snapshot) => {
    snapshotByMonth.set(snapshot.monthStart, snapshot.amount);
  });

  const currentMonthStart = toMonthStart(referenceDate);

  return getRecentMonthStarts(monthsBack, referenceDate).map((monthStart) => {
    const monthDate = parseMonthStart(monthStart);
    const monthIndex = monthDate.getMonth();
    const liveAmount =
      (transactionBalanceByMonth.get(monthStart) ?? 0) -
      (manualDepositsByMonth.get(monthStart) ?? 0);
    const hasSnapshot = snapshotByMonth.has(monthStart);
    const isCurrentMonth = monthStart === currentMonthStart;

    return {
      month: GERMAN_MONTHS_SHORT[monthIndex] ?? "",
      monthIndex,
      monthStart,
      amount: isCurrentMonth
        ? liveAmount
        : hasSnapshot
          ? (snapshotByMonth.get(monthStart) ?? 0)
          : liveAmount,
      isSnapshot: !isCurrentMonth && hasSnapshot,
      isCurrentMonth,
    };
  });
};
