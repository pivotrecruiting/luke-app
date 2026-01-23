export type UserOnboardingRow = {
  completed_at: string | null;
  onboarding_version: string | null;
  started_at?: string | null;
  skipped_steps?: unknown | null;
};

export type UserFinancialProfileRow = {
  currency: string | null;
  initial_savings_cents?: number | null;
};

export type UserRow = {
  name: string | null;
};

export type IncomeSourceRow = {
  id: string;
  name: string;
  amount_cents: number;
};

export type FixedExpenseRow = {
  id: string;
  name: string;
  amount_cents: number;
};

export type GoalRow = {
  id: string;
  name: string;
  icon: string | null;
  target_amount_cents: number;
};

export type GoalContributionRow = {
  id: string;
  goal_id: string;
  amount_cents: number;
  contribution_type: "deposit" | "repayment";
  contribution_at: string;
};

export type BudgetCategoryRow = {
  id: string;
  key: string | null;
  name: string;
  icon: string | null;
  color: string | null;
};

export type BudgetRow = {
  id: string;
  name: string;
  category_id: string | null;
  limit_amount_cents: number;
};

export type TransactionRow = {
  id: string;
  type: "income" | "expense";
  amount_cents: number;
  name: string;
  category_name: string | null;
  budget_id: string | null;
  budget_category_id: string | null;
  transaction_at: string;
};
