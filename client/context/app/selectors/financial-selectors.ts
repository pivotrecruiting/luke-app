import type { Budget, ExpenseEntry, IncomeEntry } from "@/context/app/types";

export const getTotalIncome = (incomeEntries: IncomeEntry[]): number =>
  incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);

export const getTotalFixedExpenses = (
  expenseEntries: ExpenseEntry[],
): number => expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);

export const getTotalVariableExpenses = (budgets: Budget[]): number =>
  budgets.reduce((sum, budget) => sum + budget.current, 0);

export const getMonthlyBudget = (
  totalIncome: number,
  totalFixedExpenses: number,
): number => totalIncome - totalFixedExpenses;

export const getTotalExpenses = (
  totalFixedExpenses: number,
  totalVariableExpenses: number,
): number => totalFixedExpenses + totalVariableExpenses;

export const getBalance = (
  monthlyBudget: number,
  totalVariableExpenses: number,
): number => monthlyBudget - totalVariableExpenses;

export const getSavingsRate = (
  totalIncome: number,
  totalExpenses: number,
): number => {
  if (totalIncome <= 0) return 0;
  const savings = totalIncome - totalExpenses;
  return (savings / totalIncome) * 100;
};
