import type { BudgetExpense } from "@/context/app/types";

export type ExpenseDateInfoT = {
  month: number;
  year: number;
  date: Date;
};

export type GroupedExpensesT = Record<string, BudgetExpense[]>;
