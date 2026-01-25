import { supabase } from "@/lib/supabase";
import type {
  CurrencyCode,
  ExpenseEntry,
  Goal,
  IncomeEntry,
  Transaction,
} from "@/context/app/types";
import type {
  UserProgressT,
  XpEventRuleT,
  XpEventTypeT,
  XpLevelT,
} from "@/types/xp-types";
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
  IncomeSourceRow,
  LevelRow,
  TransactionRow,
  UserProgressRow,
  UserFinancialProfileRow,
  UserOnboardingRow,
  UserRow,
  XpEventRuleRow,
  XpEventTypeRow,
} from "@/services/types";
import { toCents } from "@/utils/money";

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
  budgetCategories: BudgetCategoryRow[];
  initialSavingsCents?: number | null;
};

export const fetchAppData = async (
  userId: string,
  onboardingVersion: string,
): Promise<AppDataPayload> => {
  const [
    onboardingRes,
    profileRes,
    userRes,
    incomeRes,
    expenseRes,
    goalsRes,
    contributionsRes,
    budgetCategoriesRes,
    budgetsRes,
    transactionsRes,
  ] = await Promise.all([
    supabase
      .from("user_onboarding")
      .select("completed_at, onboarding_version, started_at, skipped_steps")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_financial_profiles")
      .select("currency, initial_savings_cents")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("users").select("name").eq("id", userId).maybeSingle(),
    supabase
      .from("income_sources")
      .select("id, name, amount_cents")
      .eq("user_id", userId),
    supabase
      .from("fixed_expenses")
      .select("id, name, amount_cents")
      .eq("user_id", userId),
    supabase
      .from("goals")
      .select("id, name, icon, target_amount_cents")
      .eq("user_id", userId),
    supabase
      .from("goal_contributions")
      .select("id, goal_id, amount_cents, contribution_type, contribution_at")
      .eq("user_id", userId),
    supabase
      .from("budget_categories")
      .select("id, key, name, icon, color")
      .eq("active", true),
    supabase
      .from("budgets")
      .select("id, name, category_id, limit_amount_cents")
      .eq("user_id", userId),
    supabase
      .from("transactions")
      .select(
        "id, type, amount_cents, name, category_name, budget_id, budget_category_id, transaction_at",
      )
      .eq("user_id", userId)
      .order("transaction_at", { ascending: false }),
  ]);

  const firstError =
    onboardingRes.error ||
    profileRes.error ||
    userRes.error ||
    incomeRes.error ||
    expenseRes.error ||
    goalsRes.error ||
    contributionsRes.error ||
    budgetCategoriesRes.error ||
    budgetsRes.error ||
    transactionsRes.error;
  if (firstError) {
    throw firstError;
  }

  let onboarding = onboardingRes.data as UserOnboardingRow | null;
  if (!onboarding) {
    const { data, error } = await supabase
      .from("user_onboarding")
      .insert({ user_id: userId, onboarding_version: onboardingVersion })
      .select()
      .single();
    if (error || !data) {
      throw error ?? new Error("No onboarding returned");
    }
    onboarding = data as UserOnboardingRow;
  }

  const profile = profileRes.data as UserFinancialProfileRow | null;
  const user = userRes.data as UserRow | null;
  const budgetCategories = (budgetCategoriesRes.data ??
    []) as BudgetCategoryRow[];

  const incomeEntries = mapIncomeEntries(
    (incomeRes.data ?? []) as IncomeSourceRow[],
  );
  const expenseEntries = mapExpenseEntries(
    (expenseRes.data ?? []) as FixedExpenseRow[],
  );
  const goals = mapGoals(
    (goalsRes.data ?? []) as GoalRow[],
    (contributionsRes.data ?? []) as GoalContributionRow[],
  );
  const { budgets, transactions } = mapBudgetsAndTransactions(
    (budgetsRes.data ?? []) as BudgetRow[],
    budgetCategories,
    (transactionsRes.data ?? []) as TransactionRow[],
  );

  const userName =
    typeof user?.name === "string" ? user.name.trim() || null : null;

  return {
    isOnboardingComplete: Boolean(onboarding?.completed_at),
    currency: (profile?.currency as CurrencyCode | undefined) ?? undefined,
    userName,
    incomeEntries,
    expenseEntries,
    goals,
    budgets,
    transactions,
    budgetCategories,
    initialSavingsCents: profile?.initial_savings_cents ?? null,
  };
};

export const upsertUserCurrency = async (
  userId: string,
  currency: CurrencyCode,
): Promise<void> => {
  const { error } = await supabase
    .from("user_financial_profiles")
    .upsert({ user_id: userId, currency }, { onConflict: "user_id" });
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
  const { data, error } = await supabase
    .from("income_sources")
    .insert({ user_id: userId, name, amount_cents: toCents(amount), currency })
    .select("id, name, amount_cents")
    .single();
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
  const { error: deleteError } = await supabase
    .from("income_sources")
    .delete()
    .eq("user_id", userId);
  if (deleteError) {
    throw deleteError;
  }
  if (entries.length === 0) {
    return [];
  }
  const { data, error } = await supabase
    .from("income_sources")
    .insert(
      entries.map((entry) => ({
        user_id: userId,
        name: entry.type,
        amount_cents: toCents(entry.amount),
        currency,
      })),
    )
    .select("id, name, amount_cents");
  if (error || !data) {
    throw error ?? new Error("No data returned");
  }
  return mapIncomeEntries(data as IncomeSourceRow[]);
};

export const updateIncomeEntry = async (
  id: string,
  name: string,
  amount: number,
): Promise<void> => {
  const { error } = await supabase
    .from("income_sources")
    .update({ name, amount_cents: toCents(amount) })
    .eq("id", id);
  if (error) {
    throw error;
  }
};

export const deleteIncomeEntry = async (id: string): Promise<void> => {
  const { error } = await supabase.from("income_sources").delete().eq("id", id);
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
  const { data, error } = await supabase
    .from("fixed_expenses")
    .insert({ user_id: userId, name, amount_cents: toCents(amount), currency })
    .select("id, name, amount_cents")
    .single();
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
  const { error: deleteError } = await supabase
    .from("fixed_expenses")
    .delete()
    .eq("user_id", userId);
  if (deleteError) {
    throw deleteError;
  }
  if (entries.length === 0) {
    return [];
  }
  const { data, error } = await supabase
    .from("fixed_expenses")
    .insert(
      entries.map((entry) => ({
        user_id: userId,
        name: entry.type,
        amount_cents: toCents(entry.amount),
        currency,
      })),
    )
    .select("id, name, amount_cents");
  if (error || !data) {
    throw error ?? new Error("No data returned");
  }
  return mapExpenseEntries(data as FixedExpenseRow[]);
};

export const updateExpenseEntry = async (
  id: string,
  name: string,
  amount: number,
): Promise<void> => {
  const { error } = await supabase
    .from("fixed_expenses")
    .update({ name, amount_cents: toCents(amount) })
    .eq("id", id);
  if (error) {
    throw error;
  }
};

export const deleteExpenseEntry = async (id: string): Promise<void> => {
  const { error } = await supabase.from("fixed_expenses").delete().eq("id", id);
  if (error) {
    throw error;
  }
};

export const createGoal = async (
  userId: string,
  name: string,
  icon: string,
  target: number,
  createdInOnboarding: boolean,
): Promise<string> => {
  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: userId,
      name,
      icon,
      target_amount_cents: toCents(target),
      monthly_contribution_cents: null,
      created_in_onboarding: createdInOnboarding,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw error ?? new Error("No goal returned");
  }
  return data.id as string;
};

export const updateGoal = async (
  goalId: string,
  updates: Partial<Goal>,
): Promise<void> => {
  const payload: Record<string, unknown> = {};
  if (typeof updates.name === "string") payload.name = updates.name;
  if (typeof updates.icon === "string") payload.icon = updates.icon;
  if (typeof updates.target === "number")
    payload.target_amount_cents = toCents(updates.target);
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase
    .from("goals")
    .update(payload)
    .eq("id", goalId);
  if (error) {
    throw error;
  }
};

export const deleteGoal = async (goalId: string): Promise<void> => {
  const { error } = await supabase.from("goals").delete().eq("id", goalId);
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
  const { data, error } = await supabase
    .from("goal_contributions")
    .insert(payload)
    .select("id")
    .single();
  if (error || !data) {
    throw error ?? new Error("No contribution returned");
  }
  return data.id as string;
};

export const updateGoalContribution = async (
  id: string,
  payload: { amount_cents: number; contribution_at: string },
): Promise<void> => {
  const { error } = await supabase
    .from("goal_contributions")
    .update(payload)
    .eq("id", id);
  if (error) {
    throw error;
  }
};

export const deleteGoalContribution = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("goal_contributions")
    .delete()
    .eq("id", id);
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
  const { data, error } = await supabase
    .from("budgets")
    .insert(payload)
    .select("id")
    .single();
  if (error || !data) {
    throw error ?? new Error("No budget returned");
  }
  return data.id as string;
};

export const updateBudget = async (
  budgetId: string,
  updates: { name?: string; limit?: number },
): Promise<void> => {
  const payload: Record<string, unknown> = {};
  if (typeof updates.name === "string") payload.name = updates.name;
  if (typeof updates.limit === "number")
    payload.limit_amount_cents = toCents(updates.limit);
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase
    .from("budgets")
    .update(payload)
    .eq("id", budgetId);
  if (error) {
    throw error;
  }
};

export const deleteBudget = async (budgetId: string): Promise<void> => {
  const { error } = await supabase.from("budgets").delete().eq("id", budgetId);
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
  transaction_at: string;
  source: "manual";
}): Promise<string> => {
  const { data, error } = await supabase
    .from("transactions")
    .insert(payload)
    .select("id")
    .single();
  if (error || !data) {
    throw error ?? new Error("No transaction returned");
  }
  return data.id as string;
};

export const updateTransaction = async (
  transactionId: string,
  payload: {
    amount_cents?: number;
    category_name?: string | null;
    name?: string;
    transaction_at?: string;
    type?: "income" | "expense";
  },
): Promise<void> => {
  const { error } = await supabase
    .from("transactions")
    .update(payload)
    .eq("id", transactionId);
  if (error) {
    throw error;
  }
};

export const deleteTransaction = async (
  transactionId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);
  if (error) {
    throw error;
  }
};

export const deleteTransactionsByBudget = async (
  budgetId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("budget_id", budgetId);
  if (error) {
    throw error;
  }
};

export const resetUserData = async (userId: string): Promise<void> => {
  const { error: contributionsError } = await supabase
    .from("goal_contributions")
    .delete()
    .eq("user_id", userId);
  if (contributionsError) throw contributionsError;

  const { error: transactionsError } = await supabase
    .from("transactions")
    .delete()
    .eq("user_id", userId);
  if (transactionsError) throw transactionsError;

  const { error: goalsError } = await supabase
    .from("goals")
    .delete()
    .eq("user_id", userId);
  if (goalsError) throw goalsError;

  const { error: budgetsError } = await supabase
    .from("budgets")
    .delete()
    .eq("user_id", userId);
  if (budgetsError) throw budgetsError;

  const { error: incomeError } = await supabase
    .from("income_sources")
    .delete()
    .eq("user_id", userId);
  if (incomeError) throw incomeError;

  const { error: expenseError } = await supabase
    .from("fixed_expenses")
    .delete()
    .eq("user_id", userId);
  if (expenseError) throw expenseError;

  const { error: profileError } = await supabase
    .from("user_financial_profiles")
    .delete()
    .eq("user_id", userId);
  if (profileError) throw profileError;

  const { error: onboardingError } = await supabase
    .from("user_onboarding")
    .update({ completed_at: null })
    .eq("user_id", userId);
  if (onboardingError) throw onboardingError;
};

export const updateOnboardingComplete = async (
  userId: string,
  onboardingVersion: string,
): Promise<void> => {
  const { error } = await supabase
    .from("user_onboarding")
    .update({
      onboarding_version: onboardingVersion,
      completed_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
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
      .select("id, level_number, name, emoji, xp_required")
      .order("xp_required", { ascending: true }),
    supabase
      .from("xp_event_types")
      .select(
        "id, key, label, base_xp, active, max_per_user, cooldown_hours",
      )
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
  const eventTypes = mapXpEventTypes(
    (typesRes.data ?? []) as XpEventTypeRow[],
  );
  const eventRules = mapXpEventRules(
    (rulesRes.data ?? []) as XpEventRuleRow[],
  );

  return { levels, eventTypes, eventRules };
};

export const getOrCreateUserProgress = async (
  userId: string,
  initialLevelId: string | null,
): Promise<UserProgressT> => {
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

  const { data: created, error: insertError } = await supabase
    .from("user_progress")
    .insert({
      user_id: userId,
      xp_total: 0,
      current_level_id: initialLevelId,
      current_streak: 0,
      longest_streak: 0,
      last_login_at: null,
      last_streak_date: null,
    })
    .select(
      "id, user_id, xp_total, current_level_id, current_streak, longest_streak, last_login_at, last_streak_date, created_at, updated_at",
    )
    .single();
  if (insertError || !created) {
    throw insertError ?? new Error("No user progress created");
  }
  return mapUserProgress(created as UserProgressRow);
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
