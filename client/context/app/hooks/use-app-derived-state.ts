import { useMemo } from "react";
import type {
  Budget,
  ExpenseEntry,
  IncomeEntry,
  InsightCategory,
  MonthlyBalanceSnapshotT,
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
  monthlyBalanceSnapshots: MonthlyBalanceSnapshotT[];
  selectedWeekOffset: number;
  referenceDate: Date;
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
  monthlyBalanceSnapshots,
  selectedWeekOffset,
  referenceDate,
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
    () => getTransactionBalanceForMonth(transactions, referenceDate),
    [referenceDate, transactions],
  );

  const monthlyBalance = useMemo(() => {
    const currentYear = referenceDate.getFullYear();
    const currentMonth = referenceDate.getMonth();
    const manualVaultDeposits = vaultTransactions.reduce((sum, entry) => {
      if (entry.entryType !== "manual_deposit") return sum;
      const entryDate = new Date(entry.transactionAt);
      const isCurrentMonth =
        entryDate.getFullYear() === currentYear &&
        entryDate.getMonth() === currentMonth;
      return isCurrentMonth ? sum + entry.amount : sum;
    }, 0);
    return monthlyTransactionBalance - manualVaultDeposits;
  }, [monthlyTransactionBalance, referenceDate, vaultTransactions]);

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
        transactions,
        vaultTransactions,
        monthlyBalanceSnapshots,
        12,
        referenceDate,
      ),
    [monthlyBalanceSnapshots, referenceDate, transactions, vaultTransactions],
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
