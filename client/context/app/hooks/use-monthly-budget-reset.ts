import { useCallback, useEffect } from "react";
import type { Budget } from "@/context/app/types";
import { parseFormattedDate } from "@/utils/dates";

type UseMonthlyBudgetResetParamsT = {
  budgets: Budget[];
  isAppLoading: boolean;
  lastBudgetResetMonth: number;
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  setLastBudgetResetMonth: React.Dispatch<React.SetStateAction<number>>;
};

/**
 * Keeps monthly budget totals in sync with current month expenses.
 */
export const useMonthlyBudgetReset = ({
  budgets,
  isAppLoading,
  lastBudgetResetMonth,
  setBudgets,
  setLastBudgetResetMonth,
}: UseMonthlyBudgetResetParamsT) => {
  const resetMonthlyBudgets = useCallback(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    if (currentMonth !== lastBudgetResetMonth) {
      setBudgets((prev) =>
        prev.map((budget) => {
          const currentMonthExpenses = budget.expenses.filter((expense) => {
            const timestamp =
              expense.timestamp || parseFormattedDate(expense.date).getTime();
            const expenseDate = new Date(timestamp);
            return (
              expenseDate.getMonth() === currentMonth &&
              expenseDate.getFullYear() === currentYear
            );
          });
          const currentMonthTotal = currentMonthExpenses.reduce(
            (sum, e) => sum + e.amount,
            0,
          );
          return {
            ...budget,
            current: currentMonthTotal,
          };
        }),
      );
      setLastBudgetResetMonth(currentMonth);
    }
  }, [lastBudgetResetMonth, setBudgets, setLastBudgetResetMonth]);

  useEffect(() => {
    if (isAppLoading) return;
    const currentMonth = new Date().getMonth();
    if (currentMonth !== lastBudgetResetMonth) {
      resetMonthlyBudgets();
    }
  }, [isAppLoading, lastBudgetResetMonth, resetMonthlyBudgets]);

  return { resetMonthlyBudgets };
};
