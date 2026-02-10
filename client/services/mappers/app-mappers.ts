import type {
  Budget,
  BudgetExpense,
  ExpenseEntry,
  Goal,
  GoalDeposit,
  IncomeEntry,
  Transaction,
} from "@/context/app/types";
import { formatDate } from "@/utils/dates";
import { fromCents } from "@/utils/money";
import type {
  BudgetCategoryRow,
  BudgetRow,
  FixedExpenseRow,
  GoalContributionRow,
  GoalRow,
  IncomeSourceRow,
  TransactionRow,
} from "@/services/types";

export const mapIncomeEntries = (rows: IncomeSourceRow[]): IncomeEntry[] =>
  rows.map((row) => ({
    id: row.id,
    type: row.name,
    amount: fromCents(row.amount_cents),
  }));

export const mapExpenseEntries = (rows: FixedExpenseRow[]): ExpenseEntry[] =>
  rows.map((row) => ({
    id: row.id,
    type: row.name,
    amount: fromCents(row.amount_cents),
  }));

export const mapGoals = (
  goalRows: GoalRow[],
  contributionRows: GoalContributionRow[],
): Goal[] => {
  const depositsByGoal: Record<string, GoalDeposit[]> = {};
  const goalBalances: Record<string, number> = {};

  contributionRows.forEach((row) => {
    const amount = fromCents(row.amount_cents);
    const type =
      row.contribution_type === "deposit" ? "Einzahlung" : "Rückzahlung";
    if (!depositsByGoal[row.goal_id]) {
      depositsByGoal[row.goal_id] = [];
    }
    depositsByGoal[row.goal_id].push({
      id: row.id,
      date: formatDate(new Date(row.contribution_at)),
      amount,
      type,
    });
    goalBalances[row.goal_id] = (goalBalances[row.goal_id] ?? 0) + amount;
  });

  return goalRows.map((row) => {
    const target = fromCents(row.target_amount_cents);
    const current = goalBalances[row.id] ?? 0;
    const monthlyContribution =
      typeof row.monthly_contribution_cents === "number"
        ? fromCents(row.monthly_contribution_cents)
        : null;
    return {
      id: row.id,
      name: row.name,
      icon: row.icon ?? "🎯",
      target,
      monthlyContribution,
      current,
      remaining: target - current,
      deposits: depositsByGoal[row.id] ?? [],
    };
  });
};

export const mapBudgetsAndTransactions = (
  budgetRows: BudgetRow[],
  budgetCategoryRows: BudgetCategoryRow[],
  transactionRows: TransactionRow[],
): { budgets: Budget[]; transactions: Transaction[] } => {
  const budgetCategoryMap = new Map<string, BudgetCategoryRow>();
  budgetCategoryRows.forEach((category) => {
    budgetCategoryMap.set(category.id, category);
  });

  const budgetMap = new Map<string, { id: string; name: string }>();
  const budgetsBase = budgetRows.map((row) => {
    const category = row.category_id
      ? budgetCategoryMap.get(row.category_id)
      : null;
    budgetMap.set(row.id, { id: row.id, name: row.name });
    return {
      id: row.id,
      name: row.name,
      icon: category?.icon ?? "circle",
      iconColor: category?.color ?? "#6B7280",
      limit: fromCents(row.limit_amount_cents),
      current: 0,
      expenses: [],
    } as Budget;
  });

  const expensesByBudgetId: Record<string, BudgetExpense[]> = {};
  const budgetTotals: Record<string, number> = {};
  const now = new Date();

  const mappedTransactions = transactionRows.map((row) => {
    const transactionDate = new Date(row.transaction_at);
    const amount =
      row.type === "expense"
        ? -fromCents(row.amount_cents)
        : fromCents(row.amount_cents);
    const budget = row.budget_id ? budgetMap.get(row.budget_id) : null;
    const budgetCategory = row.budget_category_id
      ? budgetCategoryMap.get(row.budget_category_id)
      : null;
    const category = budget?.name ?? row.category_name ?? row.name;
    const icon = budgetCategory?.icon ?? "circle";
    const formattedDate = formatDate(transactionDate);

    if (row.type === "expense" && row.budget_id) {
      const expense: BudgetExpense = {
        id: row.id,
        name: row.name,
        date: formattedDate,
        amount: fromCents(row.amount_cents),
        timestamp: transactionDate.getTime(),
      };
      if (!expensesByBudgetId[row.budget_id]) {
        expensesByBudgetId[row.budget_id] = [];
      }
      expensesByBudgetId[row.budget_id].push(expense);

      const isCurrentMonth =
        transactionDate.getMonth() === now.getMonth() &&
        transactionDate.getFullYear() === now.getFullYear();
      if (isCurrentMonth) {
        budgetTotals[row.budget_id] =
          (budgetTotals[row.budget_id] ?? 0) + expense.amount;
      }
    }

    return {
      id: row.id,
      name: row.name,
      category,
      date: formattedDate,
      amount,
      icon,
      timestamp: transactionDate.getTime(),
    };
  });

  const hydratedBudgets = budgetsBase.map((budget) => ({
    ...budget,
    expenses: expensesByBudgetId[budget.id] ?? [],
    current: budgetTotals[budget.id] ?? 0,
  }));

  return { budgets: hydratedBudgets, transactions: mappedTransactions };
};
