import { supabase } from "@/lib/supabase";
import type {
  CurrencyCode,
  ExpenseEntry,
  Goal,
  IncomeEntry,
  MonthlyBalanceSnapshotT,
  MonthlyTrendData,
  Transaction,
  TransactionSourceT,
  VaultTransactionT,
} from "@/context/app/types";
import {
  mapBudgetsAndTransactions,
  mapExpenseEntries,
  mapGoals,
  mapIncomeEntries,
} from "@/services/mappers/app-mappers";
import {
  mapLevels,
  mapUserProgress,
  mapXpEventRules,
  mapXpEventTypes,
} from "@/services/mappers/xp-mappers";
import type {
  BudgetCategoryRow,
  BudgetRow,
  FixedExpenseRow,
  GoalContributionRow,
  GoalRow,
  IncomeCategoryRow,
  IncomeSourceRow,
  LevelRow,
  MonthlyBalanceSnapshotRow,
  TransactionRow,
  UserFinancialProfileRow,
  UserOnboardingRow,
  UserProgressRow,
  VaultTransactionRow,
  XpEventRuleRow,
  XpEventTypeRow,
} from "@/services/types";
import type {
  UserProgressT,
  XpEventRuleT,
  XpEventTypeT,
  XpLevelT,
} from "@/types/xp-types";
import { fromCents, toCents } from "@/utils/money";

export type AppDataPayload = {
  isOnboardingComplete: boolean;
  currency?: CurrencyCode;
  userName: string | null;
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  goals: Goal[];
  budgets: {
    id: string;
    name: string;
    icon: string;
    iconColor: string;
    limit: number;
    current: number;
    expenses: {
      id: string;
      name: string;
      date: string;
      amount: number;
      timestamp?: number;
    }[];
  }[];
  transactions: Transaction[];
  vaultTransactions: VaultTransactionT[];
  monthlyBalanceSnapshots: MonthlyBalanceSnapshotT[];
  monthlyTrendData: MonthlyTrendData[];
  budgetCategories: BudgetCategoryRow[];
  incomeCategories: IncomeCategoryRow[];
  initialSavingsCents?: number | null;
  balanceAnchorMonth?: string | null;
};

type RpcAppDataPayloadT = {
  userName?: string | null;
  onboarding?: UserOnboardingRow | null;
  profile?: UserFinancialProfileRow | null;
  incomeSources?: IncomeSourceRow[];
  fixedExpenses?: FixedExpenseRow[];
  goals?: GoalRow[];
  goalContributions?: GoalContributionRow[];
  budgetCategories?: BudgetCategoryRow[];
  incomeCategories?: IncomeCategoryRow[];
  budgets?: BudgetRow[];
  transactions?: TransactionRow[];
  vaultTransactions?: VaultTransactionRow[];
  monthlyBalanceSnapshots?: MonthlyBalanceSnapshotRow[];
};

type RpcMonthlyBalanceStatePayloadT = {
  vaultTransactions?: VaultTransactionRow[];
  monthlyBalanceSnapshots?: MonthlyBalanceSnapshotRow[];
  balanceAnchorMonth?: string | null;
};

const mapMonthlyBalanceSnapshots = (
  rows: MonthlyBalanceSnapshotRow[],
): MonthlyBalanceSnapshotT[] =>
  rows.map((row) => ({
    id: row.id,
    monthStart: row.month_start,
    amount: fromCents(row.amount_cents),
    currency: row.currency as CurrencyCode,
    snapshotAt: row.snapshot_at,
  }));

const mapVaultTransactions = (
  rows: VaultTransactionRow[],
): VaultTransactionT[] =>
  rows.map((row) => ({
    id: row.id,
    amount: fromCents(row.amount_cents),
    entryType: row.entry_type,
    note: row.note ?? null,
    goalId: row.goal_id ?? null,
    rolloverMonth: row.rollover_month ?? null,
    transactionAt: row.transaction_at,
  }));

export type MonthlyBalanceStatePayloadT = {
  vaultTransactions: VaultTransactionT[];
  monthlyBalanceSnapshots: MonthlyBalanceSnapshotT[];
  balanceAnchorMonth: string | null;
};

const ensureMyUserRow = async (): Promise<void> => {
  const { error } = await supabase.rpc("ensure_my_user_row");
  if (error) {
    throw error;
  }
};

const getRpcObject = <T extends object>(data: unknown, rpcName: string): T => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`Unexpected RPC payload from ${rpcName}.`);
  }

  return data as T;
};

const getRpcArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const getRpcId = (data: unknown, rpcName: string): string => {
  if (typeof data !== "string" || data.length === 0) {
    throw new Error(`Unexpected RPC id payload from ${rpcName}.`);
  }

  return data;
};

export const syncMonthlyBalanceState = async (): Promise<void> => {
  const { error } = await supabase.rpc("sync_my_monthly_balance_snapshots");
  if (error) {
    throw error;
  }
};

export const fetchMonthlyBalanceState = async (
  userId: string,
): Promise<MonthlyBalanceStatePayloadT> => {
  void userId;

  await ensureMyUserRow();

  const { data, error } = await supabase.rpc("get_my_monthly_balance_state");
  if (error) {
    throw error;
  }

  const payload = getRpcObject<RpcMonthlyBalanceStatePayloadT>(
    data,
    "get_my_monthly_balance_state",
  );

  return {
    vaultTransactions: mapVaultTransactions(
      getRpcArray<VaultTransactionRow>(payload.vaultTransactions),
    ),
    monthlyBalanceSnapshots: mapMonthlyBalanceSnapshots(
      getRpcArray<MonthlyBalanceSnapshotRow>(payload.monthlyBalanceSnapshots),
    ),
    balanceAnchorMonth: payload.balanceAnchorMonth ?? null,
  };
};

export const fetchAppData = async (
  userId: string,
  onboardingVersion: string,
): Promise<AppDataPayload> => {
  void userId;

  const { data, error } = await supabase.rpc("get_my_app_data", {
    input_onboarding_version: onboardingVersion,
  });

  if (error) {
    throw error;
  }

  const payload = getRpcObject<RpcAppDataPayloadT>(data, "get_my_app_data");
  const onboarding = payload.onboarding ?? null;
  const profile = payload.profile ?? null;
  const budgetCategories = getRpcArray<BudgetCategoryRow>(
    payload.budgetCategories,
  );
  const incomeCategories = getRpcArray<IncomeCategoryRow>(
    payload.incomeCategories,
  );
  const incomeSources = getRpcArray<IncomeSourceRow>(payload.incomeSources);
  const fixedExpenses = getRpcArray<FixedExpenseRow>(payload.fixedExpenses);
  const goalsRows = getRpcArray<GoalRow>(payload.goals);
  const goalContributionRows = getRpcArray<GoalContributionRow>(
    payload.goalContributions,
  );
  const budgetsRows = getRpcArray<BudgetRow>(payload.budgets);
  const transactionRows = getRpcArray<TransactionRow>(payload.transactions);
  const vaultTransactionRows = getRpcArray<VaultTransactionRow>(
    payload.vaultTransactions,
  );
  const monthlySnapshotRows = getRpcArray<MonthlyBalanceSnapshotRow>(
    payload.monthlyBalanceSnapshots,
  );

  const incomeEntries = mapIncomeEntries(incomeSources);
  const expenseEntries = mapExpenseEntries(fixedExpenses);
  const goals = mapGoals(goalsRows, goalContributionRows);
  const { budgets, transactions } = mapBudgetsAndTransactions(
    budgetsRows,
    budgetCategories,
    transactionRows,
  );
  const monthlyBalanceSnapshots =
    mapMonthlyBalanceSnapshots(monthlySnapshotRows);
  const vaultTransactions = mapVaultTransactions(vaultTransactionRows);

  return {
    isOnboardingComplete: Boolean(onboarding?.completed_at),
    currency: (profile?.currency as CurrencyCode | undefined) ?? undefined,
    userName:
      typeof payload.userName === "string"
        ? payload.userName.trim() || null
        : null,
    incomeEntries,
    expenseEntries,
    goals,
    budgets,
    transactions,
    vaultTransactions,
    monthlyBalanceSnapshots,
    monthlyTrendData: [],
    budgetCategories,
    incomeCategories,
    initialSavingsCents: profile?.initial_savings_cents ?? null,
    balanceAnchorMonth: profile?.balance_anchor_month ?? null,
  };
};

export const upsertUserCurrency = async (
  userId: string,
  currency: CurrencyCode,
): Promise<void> => {
  void userId;

  const { error } = await supabase.rpc("upsert_my_user_currency", {
    input_currency: currency,
  });
  if (error) {
    throw error;
  }
};

export const upsertUserName = async (
  userId: string,
  name: string,
): Promise<void> => {
  void userId;

  const { error } = await supabase.rpc("update_my_user_name", {
    input_name: name.trim(),
  });

  if (error) {
    throw error;
  }
};

export const upsertInitialSavings = async (
  userId: string,
  amount: number,
  currency: CurrencyCode,
): Promise<void> => {
  void userId;

  const { error } = await supabase.rpc("upsert_my_initial_savings", {
    input_amount_cents: toCents(amount),
    input_currency: currency,
  });
  if (error) {
    throw error;
  }
};

export const upsertBalanceAnchorMonth = async (
  userId: string,
  balanceAnchorMonth: string,
): Promise<void> => {
  void userId;

  const { error } = await supabase.rpc("upsert_my_balance_anchor_month", {
    input_balance_anchor_month: balanceAnchorMonth,
  });
  if (error) {
    throw error;
  }
};

export const createIncomeEntry = async (
  userId: string,
  name: string,
  amount: number,
  currency: CurrencyCode,
): Promise<IncomeEntry> => {
  void userId;

  const { data, error } = await supabase.rpc("create_my_income_source", {
    input_name: name,
    input_amount_cents: toCents(amount),
    input_currency: currency,
  });
  if (error || !data) {
    throw error ?? new Error("No data returned");
  }
  return mapIncomeEntries([data as IncomeSourceRow])[0];
};

export const replaceIncomeEntries = async (
  userId: string,
  entries: { type: string; amount: number }[],
  currency: CurrencyCode,
): Promise<IncomeEntry[]> => {
  void userId;

  const { data, error } = await supabase.rpc("replace_my_income_sources", {
    input_entries: entries.map((entry) => ({
      name: entry.type,
      amount_cents: toCents(entry.amount),
    })),
    input_currency: currency,
  });
  if (error) {
    throw error;
  }
  return mapIncomeEntries(getRpcArray<IncomeSourceRow>(data));
};

export const updateIncomeEntry = async (
  id: string,
  name: string,
  amount: number,
): Promise<void> => {
  const { error } = await supabase.rpc("update_my_income_source", {
    input_id: id,
    input_name: name,
    input_amount_cents: toCents(amount),
  });
  if (error) {
    throw error;
  }
};

export const deleteIncomeEntry = async (id: string): Promise<void> => {
  const { error } = await supabase.rpc("delete_my_income_source", {
    input_id: id,
  });
  if (error) {
    throw error;
  }
};

export const createExpenseEntry = async (
  userId: string,
  name: string,
  amount: number,
  currency: CurrencyCode,
): Promise<ExpenseEntry> => {
  void userId;

  const { data, error } = await supabase.rpc("create_my_fixed_expense", {
    input_name: name,
    input_amount_cents: toCents(amount),
    input_currency: currency,
  });
  if (error || !data) {
    throw error ?? new Error("No data returned");
  }
  return mapExpenseEntries([data as FixedExpenseRow])[0];
};

export const replaceExpenseEntries = async (
  userId: string,
  entries: { type: string; amount: number }[],
  currency: CurrencyCode,
): Promise<ExpenseEntry[]> => {
  void userId;

  const { data, error } = await supabase.rpc("replace_my_fixed_expenses", {
    input_entries: entries.map((entry) => ({
      name: entry.type,
      amount_cents: toCents(entry.amount),
    })),
    input_currency: currency,
  });
  if (error) {
    throw error;
  }
  return mapExpenseEntries(getRpcArray<FixedExpenseRow>(data));
};

export const updateExpenseEntry = async (
  id: string,
  name: string,
  amount: number,
): Promise<void> => {
  const { error } = await supabase.rpc("update_my_fixed_expense", {
    input_id: id,
    input_name: name,
    input_amount_cents: toCents(amount),
  });
  if (error) {
    throw error;
  }
};

export const deleteExpenseEntry = async (id: string): Promise<void> => {
  const { error } = await supabase.rpc("delete_my_fixed_expense", {
    input_id: id,
  });
  if (error) {
    throw error;
  }
};

export const createGoal = async (
  userId: string,
  name: string,
  icon: string,
  target: number,
  monthlyContribution: number | null,
  createdInOnboarding: boolean,
): Promise<string> => {
  void userId;

  const { data, error } = await supabase.rpc("create_my_goal", {
    input_name: name,
    input_icon: icon,
    input_target_amount_cents: toCents(target),
    input_monthly_contribution_cents:
      typeof monthlyContribution === "number"
        ? toCents(monthlyContribution)
        : null,
    input_created_in_onboarding: createdInOnboarding,
  });
  if (error || !data) {
    throw error ?? new Error("No goal returned");
  }
  return getRpcId(data, "create_my_goal");
};

export const updateGoal = async (
  goalId: string,
  updates: Partial<Goal>,
): Promise<void> => {
  const params: Record<string, unknown> = {
    input_goal_id: goalId,
    input_clear_monthly_contribution: updates.monthlyContribution === null,
  };

  let hasChanges = false;

  if (typeof updates.name === "string") {
    params.input_name = updates.name;
    hasChanges = true;
  }

  if (typeof updates.icon === "string") {
    params.input_icon = updates.icon;
    hasChanges = true;
  }

  if (typeof updates.target === "number") {
    params.input_target_amount_cents = toCents(updates.target);
    hasChanges = true;
  }

  if (typeof updates.monthlyContribution === "number") {
    params.input_monthly_contribution_cents = toCents(
      updates.monthlyContribution,
    );
    hasChanges = true;
  }

  if (updates.monthlyContribution === null) {
    hasChanges = true;
  }

  if (!hasChanges) {
    return;
  }

  const { error } = await supabase.rpc("update_my_goal", params);
  if (error) {
    throw error;
  }
};

export const deleteGoal = async (goalId: string): Promise<void> => {
  const { error } = await supabase.rpc("delete_my_goal", {
    input_goal_id: goalId,
  });
  if (error) {
    throw error;
  }
};

export const createGoalContribution = async (payload: {
  user_id: string;
  goal_id: string;
  amount_cents: number;
  currency: CurrencyCode;
  contribution_type: "deposit" | "repayment";
  contribution_at: string;
  transaction_id?: string | null;
}): Promise<string> => {
  void payload.user_id;

  const { data, error } = await supabase.rpc("create_my_goal_contribution", {
    input_goal_id: payload.goal_id,
    input_amount_cents: payload.amount_cents,
    input_currency: payload.currency,
    input_contribution_type: payload.contribution_type,
    input_contribution_at: payload.contribution_at,
    input_transaction_id: payload.transaction_id ?? null,
  });
  if (error || !data) {
    throw error ?? new Error("No contribution returned");
  }
  return getRpcId(data, "create_my_goal_contribution");
};

export const updateGoalContribution = async (
  id: string,
  payload: { amount_cents: number; contribution_at: string },
): Promise<void> => {
  const { error } = await supabase.rpc("update_my_goal_contribution", {
    input_id: id,
    input_amount_cents: payload.amount_cents,
    input_contribution_at: payload.contribution_at,
  });
  if (error) {
    throw error;
  }
};

export const deleteGoalContribution = async (id: string): Promise<void> => {
  const { error } = await supabase.rpc("delete_my_goal_contribution", {
    input_id: id,
  });
  if (error) {
    throw error;
  }
};

export const createBudget = async (payload: {
  user_id: string;
  category_id: string | null | undefined;
  name: string;
  limit_amount_cents: number;
  period: "monthly";
  currency: CurrencyCode;
  is_active: boolean;
}): Promise<string> => {
  void payload.user_id;

  const { data, error } = await supabase.rpc("create_my_budget", {
    input_category_id: payload.category_id ?? null,
    input_name: payload.name,
    input_limit_amount_cents: payload.limit_amount_cents,
    input_period: payload.period,
    input_currency: payload.currency,
    input_is_active: payload.is_active,
  });
  if (error || !data) {
    throw error ?? new Error("No budget returned");
  }
  return getRpcId(data, "create_my_budget");
};

export const updateBudget = async (
  budgetId: string,
  updates: { name?: string; limit?: number },
): Promise<void> => {
  const params: Record<string, unknown> = {
    input_budget_id: budgetId,
  };

  let hasChanges = false;

  if (typeof updates.name === "string") {
    params.input_name = updates.name;
    hasChanges = true;
  }

  if (typeof updates.limit === "number") {
    params.input_limit_amount_cents = toCents(updates.limit);
    hasChanges = true;
  }

  if (!hasChanges) {
    return;
  }

  const { error } = await supabase.rpc("update_my_budget", params);
  if (error) {
    throw error;
  }
};

export const deleteBudget = async (budgetId: string): Promise<void> => {
  const { error } = await supabase.rpc("delete_my_budget", {
    input_budget_id: budgetId,
  });
  if (error) {
    throw error;
  }
};

export const createTransaction = async (payload: {
  user_id: string;
  type: "income" | "expense";
  amount_cents: number;
  currency: CurrencyCode;
  name: string;
  category_name?: string | null;
  budget_id?: string | null;
  budget_category_id?: string | null;
  income_category_id?: string | null;
  transaction_at: string;
  source: TransactionSourceT;
}): Promise<string> => {
  void payload.user_id;

  const { data, error } = await supabase.rpc("create_my_transaction", {
    input_type: payload.type,
    input_amount_cents: payload.amount_cents,
    input_currency: payload.currency,
    input_name: payload.name,
    input_category_name: payload.category_name ?? null,
    input_budget_id: payload.budget_id ?? null,
    input_budget_category_id: payload.budget_category_id ?? null,
    input_income_category_id: payload.income_category_id ?? null,
    input_transaction_at: payload.transaction_at,
    input_source: payload.source,
  });
  if (error || !data) {
    throw error ?? new Error("No transaction returned");
  }
  return getRpcId(data, "create_my_transaction");
};

export const createVaultTransaction = async (payload: {
  user_id: string;
  amount_cents: number;
  currency: CurrencyCode;
  entry_type: "monthly_rollover" | "manual_deposit" | "goal_deposit";
  note?: string | null;
  goal_id?: string | null;
  rollover_month?: string | null;
  transaction_at: string;
}): Promise<string> => {
  void payload.user_id;

  const { data, error } = await supabase.rpc("create_my_vault_transaction", {
    input_amount_cents: payload.amount_cents,
    input_currency: payload.currency,
    input_entry_type: payload.entry_type,
    input_note: payload.note ?? null,
    input_goal_id: payload.goal_id ?? null,
    input_rollover_month: payload.rollover_month ?? null,
    input_transaction_at: payload.transaction_at,
  });
  if (error || !data) {
    throw error ?? new Error("No vault transaction returned");
  }
  return getRpcId(data, "create_my_vault_transaction");
};

export const updateTransaction = async (
  transactionId: string,
  payload: {
    amount_cents?: number;
    category_name?: string | null;
    income_category_id?: string | null;
    budget_category_id?: string | null;
    name?: string;
    transaction_at?: string;
    type?: "income" | "expense";
  },
): Promise<void> => {
  const params: Record<string, unknown> = {
    input_transaction_id: transactionId,
  };

  let hasChanges = false;

  if (typeof payload.amount_cents === "number") {
    params.input_amount_cents = payload.amount_cents;
    hasChanges = true;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "category_name")) {
    params.input_category_name = payload.category_name ?? null;
    hasChanges = true;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "income_category_id")) {
    params.input_income_category_id = payload.income_category_id ?? null;
    params.input_clear_income_category_id = payload.income_category_id === null;
    hasChanges = true;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "budget_category_id")) {
    params.input_budget_category_id = payload.budget_category_id ?? null;
    params.input_clear_budget_category_id = payload.budget_category_id === null;
    hasChanges = true;
  }

  if (typeof payload.name === "string") {
    params.input_name = payload.name;
    hasChanges = true;
  }

  if (typeof payload.transaction_at === "string") {
    params.input_transaction_at = payload.transaction_at;
    hasChanges = true;
  }

  if (typeof payload.type === "string") {
    params.input_type = payload.type;
    hasChanges = true;
  }

  if (!hasChanges) {
    return;
  }

  const { error } = await supabase.rpc("update_my_transaction", params);
  if (error) {
    throw error;
  }
};

export const deleteTransaction = async (
  transactionId: string,
): Promise<void> => {
  const { error } = await supabase.rpc("delete_my_transaction", {
    input_transaction_id: transactionId,
  });
  if (error) {
    throw error;
  }
};

export const deleteTransactionsByBudget = async (
  budgetId: string,
): Promise<void> => {
  const { error } = await supabase.rpc("delete_my_transactions_by_budget", {
    input_budget_id: budgetId,
  });
  if (error) {
    throw error;
  }
};

export const resetUserData = async (userId: string): Promise<void> => {
  void userId;

  const { error } = await supabase.rpc("reset_my_user_data");
  if (error) {
    throw error;
  }
};

export const updateOnboardingComplete = async (
  userId: string,
  onboardingVersion: string,
): Promise<void> => {
  void userId;

  const { error } = await supabase.rpc("update_my_onboarding_complete", {
    input_onboarding_version: onboardingVersion,
  });
  if (error) {
    throw error;
  }
};

export type XpConfigPayloadT = {
  levels: XpLevelT[];
  eventTypes: XpEventTypeT[];
  eventRules: XpEventRuleT[];
};

export type UserProgressUpdatePayloadT = {
  xp_total?: number;
  current_level_id?: string | null;
  current_streak?: number;
  longest_streak?: number;
  last_login_at?: string | null;
  last_streak_date?: string | null;
};

export type CreateXpEventPayloadT = {
  userId: string;
  eventTypeId: string;
  eventTypeKey: string;
  baseXp: number;
  appliedMultiplier: number;
  xpDelta: number;
  sourceType?: string | null;
  sourceId?: string | null;
  meta?: Record<string, unknown> | null;
};

export const fetchXpConfig = async (): Promise<XpConfigPayloadT> => {
  const [levelsRes, typesRes, rulesRes] = await Promise.all([
    supabase
      .from("levels")
      .select("id, level_number, name, description, emoji, xp_required")
      .order("xp_required", { ascending: true }),
    supabase
      .from("xp_event_types")
      .select("id, key, label, base_xp, active, max_per_user, cooldown_hours")
      .eq("active", true),
    supabase
      .from("xp_event_rules")
      .select(
        "id, event_type_id, rule_key, multiplier, conditions, active, starts_at, ends_at",
      )
      .eq("active", true),
  ]);

  const firstError = levelsRes.error || typesRes.error || rulesRes.error;
  if (firstError) {
    throw firstError;
  }

  const levels = mapLevels((levelsRes.data ?? []) as LevelRow[]);
  const eventTypes = mapXpEventTypes((typesRes.data ?? []) as XpEventTypeRow[]);
  const eventRules = mapXpEventRules((rulesRes.data ?? []) as XpEventRuleRow[]);

  return { levels, eventTypes, eventRules };
};

export const getOrCreateUserProgress = async (
  userId: string,
  initialLevelId: string | null,
): Promise<UserProgressT> => {
  void userId;

  await ensureMyUserRow();

  const { data, error } = await supabase
    .from("user_progress")
    .select(
      "id, user_id, xp_total, current_level_id, current_streak, longest_streak, last_login_at, last_streak_date, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (data) {
    return mapUserProgress(data as UserProgressRow);
  }

  const { error: upsertError } = await supabase.from("user_progress").upsert(
    {
      user_id: userId,
      xp_total: 0,
      current_level_id: initialLevelId,
      current_streak: 0,
      longest_streak: 0,
      last_login_at: null,
      last_streak_date: null,
    },
    { onConflict: "user_id", ignoreDuplicates: true },
  );
  if (upsertError) {
    throw upsertError;
  }

  const { data: ensured, error: ensuredError } = await supabase
    .from("user_progress")
    .select(
      "id, user_id, xp_total, current_level_id, current_streak, longest_streak, last_login_at, last_streak_date, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (ensuredError || !ensured) {
    throw ensuredError ?? new Error("No user progress created");
  }
  return mapUserProgress(ensured as UserProgressRow);
};

export const updateUserProgress = async (
  userId: string,
  updates: UserProgressUpdatePayloadT,
): Promise<UserProgressT> => {
  const { data, error } = await supabase
    .from("user_progress")
    .update(updates)
    .eq("user_id", userId)
    .select(
      "id, user_id, xp_total, current_level_id, current_streak, longest_streak, last_login_at, last_streak_date, created_at, updated_at",
    )
    .single();
  if (error || !data) {
    throw error ?? new Error("No user progress returned");
  }
  return mapUserProgress(data as UserProgressRow);
};

export const createXpEvent = async (
  payload: CreateXpEventPayloadT,
): Promise<void> => {
  const { error } = await supabase.from("xp_events").insert({
    user_id: payload.userId,
    event_type: payload.eventTypeKey,
    event_type_id: payload.eventTypeId,
    base_xp: payload.baseXp,
    applied_multiplier: payload.appliedMultiplier,
    xp_delta: payload.xpDelta,
    source_type: payload.sourceType ?? null,
    source_id: payload.sourceId ?? null,
    meta: payload.meta ?? null,
  });
  if (error) {
    throw error;
  }
};

export const fetchXpEventCount = async (
  userId: string,
  eventTypeId: string,
  eventTypeKey?: string,
): Promise<number> => {
  let query = supabase
    .from("xp_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (eventTypeKey) {
    query = query.or(
      `event_type_id.eq.${eventTypeId},event_type.eq.${eventTypeKey}`,
    );
  } else {
    query = query.eq("event_type_id", eventTypeId);
  }

  const { count, error } = await query;
  if (error) {
    throw error;
  }
  return count ?? 0;
};

export const fetchLatestXpEventAt = async (
  userId: string,
  eventTypeId: string,
  eventTypeKey?: string,
): Promise<string | null> => {
  let query = supabase
    .from("xp_events")
    .select("created_at")
    .eq("user_id", userId);

  if (eventTypeKey) {
    query = query.or(
      `event_type_id.eq.${eventTypeId},event_type.eq.${eventTypeKey}`,
    );
  } else {
    query = query.eq("event_type_id", eventTypeId);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data?.created_at ?? null;
};
