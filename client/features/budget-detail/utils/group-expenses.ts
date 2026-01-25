import type { BudgetExpense } from "@/context/app/types";
import type { GroupedExpensesT } from "../types/budget-detail-types";
import { GERMAN_MONTHS } from "../constants/budget-detail-constants";
import { parseExpenseDate } from "./date";

export const groupExpensesByMonth = (
  expenses: BudgetExpense[],
): GroupedExpensesT => {
  const grouped: GroupedExpensesT = {};

  const sortedExpenses = [...expenses].sort((a, b) => {
    const dateA = parseExpenseDate(a.date)?.date || new Date();
    const dateB = parseExpenseDate(b.date)?.date || new Date();
    return dateB.getTime() - dateA.getTime();
  });

  sortedExpenses.forEach((expense) => {
    const parsed = parseExpenseDate(expense.date);
    if (parsed) {
      const key = `${GERMAN_MONTHS[parsed.month]} ${parsed.year}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(expense);
    }
  });

  return grouped;
};
