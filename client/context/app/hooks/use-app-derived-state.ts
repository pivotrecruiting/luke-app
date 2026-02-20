import { useMemo } from "react";
import type {
  Budget,
  ExpenseEntry,
  IncomeEntry,
  InsightCategory,
  MonthlyTrendData,
  Transaction,
  VaultTransactionT,
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
  getTransactionBalanceForMonth,
  getTransactionExpenseTotal,
  getTransactionIncomeTotal,
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
  vaultTransactions: VaultTransactionT[];
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
  transactionIncomeTotal: number;
  transactionExpenseTotal: number;
  transactionBalance: number;
  monthlyBalance: number;
  vaultBalance: number;
  savingsRate: number;
  insightCategories: InsightCategory[];
  monthlyTrendData: MonthlyTrendData[];
};

export const useAppDerivedState = ({
  incomeEntries,
  expenseEntries,
  budgets,
  transactions,
  vaultTransactions,
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

  const transactionIncomeTotal = useMemo(
    () => getTransactionIncomeTotal(transactions),
    [transactions],
  );

  const transactionExpenseTotal = useMemo(
    () => getTransactionExpenseTotal(transactions),
    [transactions],
  );

  const monthlyTransactionBalance = useMemo(
    () => getTransactionBalanceForMonth(transactions, new Date()),
    [transactions],
  );

  const monthlyBalance = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const manualVaultDeposits = vaultTransactions.reduce((sum, entry) => {
      if (entry.entryType !== "manual_deposit") return sum;
      const entryDate = new Date(entry.transactionAt);
      const isCurrentMonth =
        entryDate.getFullYear() === currentYear &&
        entryDate.getMonth() === currentMonth;
      return isCurrentMonth ? sum + entry.amount : sum;
    }, 0);
    return monthlyTransactionBalance - manualVaultDeposits;
  }, [monthlyTransactionBalance, vaultTransactions]);

  const vaultBalance = useMemo(
    () => vaultTransactions.reduce((sum, entry) => sum + entry.amount, 0),
    [vaultTransactions],
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
    transactionIncomeTotal,
    transactionExpenseTotal,
    transactionBalance: monthlyBalance,
    monthlyBalance,
    vaultBalance,
    savingsRate,
    insightCategories,
    monthlyTrendData,
  };
};
