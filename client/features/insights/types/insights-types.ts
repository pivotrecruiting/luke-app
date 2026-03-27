export type InsightsTabT = "ausgaben" | "einnahmen" | "analytics";

export type InsightsFilterT = "kategorien" | "income" | "trend";

export type TimeFilterT =
  | "thisMonth"
  | "lastMonth"
  | "last3Months"
  | "last6Months"
  | "thisYear";

export type CategoryT = {
  name: string;
  amount: number;
  color: string;
};

export type IncomeTypeT = {
  id: string;
  name: string;
  icon: string;
};

export type ExpenseTypeT = {
  id: string;
  name: string;
  icon: string;
};

export type MonthlyTrendT = {
  month: string;
  monthStart: string;
  amount: number;
  isSnapshot: boolean;
  isCurrentMonth: boolean;
};

export type PeriodIncomeExpensesT = {
  label: string;
  income: number;
  expenses: number;
};
