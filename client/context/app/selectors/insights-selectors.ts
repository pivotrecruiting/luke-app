import type { Budget, ExpenseEntry, InsightCategory } from "@/context/app/types";
import { CATEGORY_COLORS, GERMAN_MONTHS_SHORT } from "@/context/app/constants";

export type MonthlyTrendDatumT = {
  month: string;
  monthIndex: number;
  amount: number;
};

export const getInsightCategories = (
  budgets: Budget[],
  expenseEntries: ExpenseEntry[],
): InsightCategory[] => {
  const categories: Record<string, number> = {};

  budgets.forEach((budget) => {
    const categoryName = budget.name;
    categories[categoryName] = (categories[categoryName] || 0) + budget.current;
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
        matched = true;
        break;
      }
    }
    if (!matched) {
      categories["Sonstiges"] =
        (categories["Sonstiges"] || 0) + entry.amount;
    }
  });

  return Object.entries(categories)
    .filter(([_, amount]) => amount > 0)
    .map(([name, amount]) => ({
      name,
      amount,
      color: CATEGORY_COLORS[name] || "#6B7280",
    }))
    .sort((a, b) => b.amount - a.amount);
};

export const getMonthlyTrendData = (
  totalExpenses: number,
  totalFixedExpenses: number,
  totalVariableExpenses: number,
): MonthlyTrendDatumT[] => {
  const currentMonth = new Date().getMonth();
  const months: MonthlyTrendDatumT[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    let amount: number;

    if (i === 0) {
      amount = totalExpenses;
    } else {
      const baseAmount = totalFixedExpenses;
      const variationFactors = [0.92, 1.08, 0.95, 1.12, 0.88, 1.05];
      const variableBase =
        totalVariableExpenses * variationFactors[i % variationFactors.length];
      amount = baseAmount + variableBase;
    }

    months.push({
      month: GERMAN_MONTHS_SHORT[monthIndex],
      monthIndex,
      amount: Math.round(amount * 100) / 100,
    });
  }

  return months;
};
