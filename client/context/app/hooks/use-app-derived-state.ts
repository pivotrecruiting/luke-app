import { useMemo } from "react";
import type {
  Budget,
  ExpenseEntry,
  IncomeEntry,
  InsightCategory,
  MonthlyTrendData,
  Transaction,
  WeeklySpending,
} from "@/context/app/types";
import {
  getBalance,
  getMonthlyBudget,
  getSavingsRate,
  getTotalExpenses,
  getTotalFixedExpenses,
  getTotalIncome,
  getTotalVariableExpenses,
} from "@/context/app/selectors/financial-selectors";
import {
  getInsightCategories,
  getMonthlyTrendData,
} from "@/context/app/selectors/insights-selectors";
import {
  getCurrentWeekLabel,
  getWeeklySpending,
} from "@/context/app/selectors/weekly-spending-selectors";

type DerivedStateInputT = {
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  budgets: Budget[];
  transactions: Transaction[];
  selectedWeekOffset: number;
};

type DerivedStateT = {
  weeklySpending: WeeklySpending[];
  currentWeekLabel: string;
  totalIncome: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  totalExpenses: number;
  monthlyBudget: number;
  balance: number;
  savingsRate: number;
  insightCategories: InsightCategory[];
  monthlyTrendData: MonthlyTrendData[];
};

export const useAppDerivedState = ({
  incomeEntries,
  expenseEntries,
  budgets,
  transactions,
  selectedWeekOffset,
}: DerivedStateInputT): DerivedStateT => {
  const weeklySpending = useMemo(
    () => getWeeklySpending(transactions, selectedWeekOffset),
    [transactions, selectedWeekOffset],
  );

  const currentWeekLabel = useMemo(
    () => getCurrentWeekLabel(selectedWeekOffset),
    [selectedWeekOffset],
  );

  const totalIncome = useMemo(
    () => getTotalIncome(incomeEntries),
    [incomeEntries],
  );

  const totalFixedExpenses = useMemo(
    () => getTotalFixedExpenses(expenseEntries),
    [expenseEntries],
  );

  const totalVariableExpenses = useMemo(
    () => getTotalVariableExpenses(budgets),
    [budgets],
  );

  const totalExpenses = useMemo(
    () => getTotalExpenses(totalFixedExpenses, totalVariableExpenses),
    [totalFixedExpenses, totalVariableExpenses],
  );

  const monthlyBudget = useMemo(
    () => getMonthlyBudget(totalIncome, totalFixedExpenses),
    [totalIncome, totalFixedExpenses],
  );

  const balance = useMemo(
    () => getBalance(monthlyBudget, totalVariableExpenses),
    [monthlyBudget, totalVariableExpenses],
  );

  const savingsRate = useMemo(
    () => getSavingsRate(totalIncome, totalExpenses),
    [totalIncome, totalExpenses],
  );

  const insightCategories = useMemo(
    () => getInsightCategories(budgets, expenseEntries),
    [budgets, expenseEntries],
  );

  const monthlyTrendData = useMemo(
    () =>
      getMonthlyTrendData(
        totalExpenses,
        totalFixedExpenses,
        totalVariableExpenses,
      ),
    [totalExpenses, totalFixedExpenses, totalVariableExpenses],
  );

  return {
    weeklySpending,
    currentWeekLabel,
    totalIncome,
    totalFixedExpenses,
    totalVariableExpenses,
    totalExpenses,
    monthlyBudget,
    balance,
    savingsRate,
    insightCategories,
    monthlyTrendData,
  };
};
