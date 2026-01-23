import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "@luke_app_data";
const ONBOARDING_VERSION = "v1";

const toCents = (value: number): number => Math.round(value * 100);
const fromCents = (value: number | null | undefined): number => (value ?? 0) / 100;

export type CurrencyCode = "EUR" | "USD" | "CHF";

export interface IncomeEntry {
  id: string;
  type: string;
  amount: number;
}

export interface ExpenseEntry {
  id: string;
  type: string;
  amount: number;
}

export interface GoalDeposit {
  id: string;
  date: string;
  amount: number;
  type: "Einzahlung" | "Rückzahlung";
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  target: number;
  current: number;
  remaining: number;
  deposits: GoalDeposit[];
}

export interface BudgetExpense {
  id: string;
  name: string;
  date: string;
  amount: number;
  timestamp?: number;
}

export interface Budget {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  limit: number;
  current: number;
  expenses: BudgetExpense[];
}

export interface WeeklySpending {
  day: string;
  amount: number;
  maxAmount: number;
}

export interface Transaction {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  icon: string;
  timestamp?: number;
}

export interface InsightCategory {
  name: string;
  amount: number;
  color: string;
}

export interface MonthlyTrendData {
  month: string;
  monthIndex: number;
  amount: number;
}

export interface AppState {
  isOnboardingComplete: boolean;
  isAppLoading: boolean;
  userName: string;
  currency: CurrencyCode;
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  goals: Goal[];
  budgets: Budget[];
  weeklySpending: WeeklySpending[];
  transactions: Transaction[];
  insightCategories: InsightCategory[];
  totalIncome: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  totalExpenses: number;
  monthlyBudget: number;
  balance: number;
  savingsRate: number;
  monthlyTrendData: MonthlyTrendData[];
  selectedWeekOffset: number;
  currentWeekLabel: string;
}

export interface AppContextType extends AppState {
  addIncomeEntry: (type: string, amount: number) => void;
  addExpenseEntry: (type: string, amount: number) => void;
  setIncomeEntries: (entries: Array<{type: string, amount: number}>) => void;
  setExpenseEntries: (entries: Array<{type: string, amount: number}>) => void;
  setCurrency: (currency: CurrencyCode) => void;
  addGoalDeposit: (goalId: string, amount: number, customDate?: Date) => void;
  updateGoalDeposit: (goalId: string, depositId: string, amount: number, date?: Date) => void;
  deleteGoalDeposit: (goalId: string, depositId: string) => void;
  addBudgetExpense: (budgetId: string, amount: number, name: string, customDate?: Date) => void;
  updateBudgetExpense: (budgetId: string, expenseId: string, amount: number, name: string, date?: Date) => void;
  deleteBudgetExpense: (budgetId: string, expenseId: string) => void;
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  updateTransaction: (transactionId: string, updates: Partial<Omit<Transaction, "id">>) => void;
  deleteTransaction: (transactionId: string) => void;
  completeOnboarding: () => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;
  updateBudget: (budgetId: string, updates: Partial<Budget>) => void;
  deleteBudget: (budgetId: string) => void;
  addGoal: (name: string, icon: string, target: number) => void;
  addBudget: (name: string, icon: string, iconColor: string, limit: number) => void;
  addExpenseWithAutobudget: (categoryName: string, icon: string, amount: number, name: string, date: Date) => void;
  updateIncomeEntry: (id: string, type: string, amount: number) => void;
  deleteIncomeEntry: (id: string) => void;
  updateExpenseEntry: (id: string, type: string, amount: number) => void;
  deleteExpenseEntry: (id: string) => void;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  resetMonthlyBudgets: () => void;
  lastBudgetResetMonth: number;
  resetAllData: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const parseFormattedDate = (dateStr: string): Date => {
  const now = new Date();
  
  if (dateStr.startsWith("Heute")) {
    const timeMatch = dateStr.match(/(\d{2}):(\d{2})/);
    if (timeMatch) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(),
        parseInt(timeMatch[1]), parseInt(timeMatch[2]));
    }
    return now;
  }
  
  if (dateStr === "Gestern" || dateStr.startsWith("Gestern")) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }
  
  const slashMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashMatch) {
    return new Date(parseInt(slashMatch[3]), parseInt(slashMatch[2]) - 1, parseInt(slashMatch[1]));
  }
  
  const dotTimeMatch = dateStr.match(/(\d{2})\.(\d{2})\.\s*(\d{2}):(\d{2})/);
  if (dotTimeMatch) {
    return new Date(now.getFullYear(), parseInt(dotTimeMatch[2]) - 1, parseInt(dotTimeMatch[1]),
      parseInt(dotTimeMatch[3]), parseInt(dotTimeMatch[4]));
  }
  
  const fullDotMatch = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (fullDotMatch) {
    return new Date(parseInt(fullDotMatch[3]), parseInt(fullDotMatch[2]) - 1, parseInt(fullDotMatch[1]));
  }
  
  return now;
};

const getWeekBounds = (weekOffset: number): { start: Date; end: Date } => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + (weekOffset * 7));
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { start: monday, end: sunday };
};

const formatWeekLabel = (weekOffset: number): string => {
  if (weekOffset === 0) {
    return "Diese Woche";
  }
  const { start, end } = getWeekBounds(weekOffset);
  const formatDay = (d: Date) => `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  return `${formatDay(start)} - ${formatDay(end)}`;
};

const calculateWeeklySpending = (transactions: Transaction[], weekOffset: number): WeeklySpending[] => {
  const { start, end } = getWeekBounds(weekOffset);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dailyAmounts = [0, 0, 0, 0, 0, 0, 0];
  
  transactions.forEach((tx) => {
    if (tx.amount >= 0) return;
    
    const txDate = parseFormattedDate(tx.date);
    if (txDate >= start && txDate <= end) {
      const dayIndex = txDate.getDay() === 0 ? 6 : txDate.getDay() - 1;
      dailyAmounts[dayIndex] += Math.abs(tx.amount);
    }
  });
  
  const maxAmount = Math.max(...dailyAmounts, 1);
  
  return days.map((day, index) => ({
    day,
    amount: Math.round(dailyAmounts[index] * 100) / 100,
    maxAmount,
  }));
};

const formatDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Heute, ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Gestern";
  } else {
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  }
};

const INITIAL_INCOME_ENTRIES: IncomeEntry[] = [];

const INITIAL_EXPENSE_ENTRIES: ExpenseEntry[] = [];

const INITIAL_GOALS: Goal[] = [];

const INITIAL_BUDGETS: Budget[] = [];

const INITIAL_TRANSACTIONS: Transaction[] = [];

const CATEGORY_COLORS: Record<string, string> = {
  "Lebensmittel": "#3B5BDB",
  "Shopping": "#9D4EDD",
  "Wohnen": "#C77DFF",
  "Abonnements": "#7B8CDE",
  "Hygiene": "#B8C4E9",
  "Sonstiges": "#6B7280",
};

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

interface PersistedData {
  isOnboardingComplete: boolean;
  currency: CurrencyCode;
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  goals: Goal[];
  budgets: Budget[];
  transactions: Transaction[];
  lastBudgetResetMonth: number;
}

type BudgetCategoryLookup = {
  id: string;
  key: string | null;
  name: string;
  icon: string | null;
  color: string | null;
};

export function AppProvider({ children }: AppProviderProps) {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [userName] = useState("Deni");
  const [currency, setCurrencyState] = useState<CurrencyCode>("EUR");
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(INITIAL_INCOME_ENTRIES);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>(INITIAL_EXPENSE_ENTRIES);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [lastBudgetResetMonth, setLastBudgetResetMonth] = useState(() => new Date().getMonth());
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategoryLookup[]>([]);
  const [useLocalFallback, setUseLocalFallback] = useState(false);

  const { user } = useAuth();
  const userId = user?.id ?? null;
  const canUseDb = Boolean(userId) && !useLocalFallback;

  const budgetCategoryByName = useMemo(() => {
    const map = new Map<string, BudgetCategoryLookup>();
    budgetCategories.forEach((category) => {
      map.set(category.name.toLowerCase(), category);
      if (category.key) {
        map.set(category.key.toLowerCase(), category);
      }
    });
    return map;
  }, [budgetCategories]);

  const handleDbError = useCallback((error: unknown, context: string) => {
    console.error(`DB error during ${context}:`, error);
    setUseLocalFallback(true);
  }, []);

  const resolveBudgetCategory = useCallback(
    (name: string) => {
      const normalized = name.trim().toLowerCase();
      return (
        budgetCategoryByName.get(normalized) ||
        budgetCategoryByName.get("sonstiges") ||
        null
      );
    },
    [budgetCategoryByName],
  );

  const loadFromLocal = useCallback(async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue !== null) {
        const data: PersistedData = JSON.parse(jsonValue);
        setIsOnboardingComplete(data.isOnboardingComplete ?? false);
        if (data.currency) {
          setCurrencyState(data.currency);
        }
        setIncomeEntries(data.incomeEntries ?? []);
        setExpenseEntries(data.expenseEntries ?? []);
        setGoals(data.goals ?? []);
        setBudgets(data.budgets ?? []);
        setTransactions(data.transactions ?? []);
        if (data.lastBudgetResetMonth !== undefined) {
          setLastBudgetResetMonth(data.lastBudgetResetMonth);
        }
      }
    } catch (e) {
      console.error("Failed to load data from storage:", e);
    }
  }, []);

  const loadFromDb = useCallback(async (id: string) => {
    const [
      onboardingRes,
      profileRes,
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
        .eq("user_id", id)
        .maybeSingle(),
      supabase
        .from("user_financial_profiles")
        .select("currency, initial_savings_cents")
        .eq("user_id", id)
        .maybeSingle(),
      supabase.from("income_sources").select("id, name, amount_cents").eq("user_id", id),
      supabase.from("fixed_expenses").select("id, name, amount_cents").eq("user_id", id),
      supabase.from("goals").select("id, name, icon, target_amount_cents").eq("user_id", id),
      supabase
        .from("goal_contributions")
        .select("id, goal_id, amount_cents, contribution_type, contribution_at")
        .eq("user_id", id),
      supabase
        .from("budget_categories")
        .select("id, key, name, icon, color")
        .eq("active", true),
      supabase
        .from("budgets")
        .select("id, name, category_id, limit_amount_cents")
        .eq("user_id", id),
      supabase
        .from("transactions")
        .select("id, type, amount_cents, name, category_name, budget_id, budget_category_id, transaction_at")
        .eq("user_id", id)
        .order("transaction_at", { ascending: false }),
    ]);

    const firstError =
      onboardingRes.error ||
      profileRes.error ||
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

    let onboarding = onboardingRes.data ?? null;
    if (!onboarding) {
      const { data, error } = await supabase
        .from("user_onboarding")
        .insert({ user_id: id, onboarding_version: ONBOARDING_VERSION })
        .select()
        .single();
      if (error) {
        throw error;
      }
      onboarding = data;
    }
    setIsOnboardingComplete(Boolean(onboarding?.completed_at));

    if (profileRes.data?.currency) {
      setCurrencyState(profileRes.data.currency as CurrencyCode);
    }

    const budgetCategoryRows = (budgetCategoriesRes.data ?? []) as BudgetCategoryLookup[];
    setBudgetCategories(budgetCategoryRows);
    const budgetCategoryMap = new Map<string, BudgetCategoryLookup>();
    budgetCategoryRows.forEach((category) => {
      budgetCategoryMap.set(category.id, category);
    });

    const budgetRows = budgetsRes.data ?? [];
    const budgetMap = new Map<string, { id: string; name: string }>();
    const budgetsBase = budgetRows.map((row) => {
      const category = budgetCategoryMap.get(row.category_id);
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

    const income = (incomeRes.data ?? []).map((row) => ({
      id: row.id,
      type: row.name,
      amount: fromCents(row.amount_cents),
    }));
    setIncomeEntries(income);

    const expenses = (expenseRes.data ?? []).map((row) => ({
      id: row.id,
      type: row.name,
      amount: fromCents(row.amount_cents),
    }));
    setExpenseEntries(expenses);

    const contributions = contributionsRes.data ?? [];
    const depositsByGoal: Record<string, GoalDeposit[]> = {};
    const goalBalances: Record<string, number> = {};
    contributions.forEach((row) => {
      const amount = fromCents(row.amount_cents);
      const type = row.contribution_type === "deposit" ? "Einzahlung" : "Rückzahlung";
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

    const goalRows = goalsRes.data ?? [];
    const mappedGoals = goalRows.map((row) => {
      const target = fromCents(row.target_amount_cents);
      const current = goalBalances[row.id] ?? 0;
      return {
        id: row.id,
        name: row.name,
        icon: row.icon ?? "🎯",
        target,
        current,
        remaining: target - current,
        deposits: depositsByGoal[row.id] ?? [],
      };
    });
    setGoals(mappedGoals);

    const transactionsRows = transactionsRes.data ?? [];
    const expensesByBudgetId: Record<string, BudgetExpense[]> = {};
    const budgetTotals: Record<string, number> = {};
    const now = new Date();
    const mappedTransactions = transactionsRows.map((row) => {
      const transactionDate = new Date(row.transaction_at);
      const amount = row.type === "expense" ? -fromCents(row.amount_cents) : fromCents(row.amount_cents);
      const budget = row.budget_id ? budgetMap.get(row.budget_id) : null;
      const budgetCategory = row.budget_category_id ? budgetCategoryMap.get(row.budget_category_id) : null;
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
          budgetTotals[row.budget_id] = (budgetTotals[row.budget_id] ?? 0) + expense.amount;
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
    setTransactions(mappedTransactions);

    const hydratedBudgets = budgetsBase.map((budget) => ({
      ...budget,
      expenses: expensesByBudgetId[budget.id] ?? [],
      current: budgetTotals[budget.id] ?? 0,
    }));
    setBudgets(hydratedBudgets);

    if (typeof profileRes.data?.initial_savings_cents === "number") {
      // TODO: wire this into UI if initial savings is displayed later.
    }
  }, []);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsAppLoading(true);
      if (!userId) {
        setUseLocalFallback(true);
        await loadFromLocal();
        if (active) {
          setIsAppLoading(false);
        }
        return;
      }

      try {
        setUseLocalFallback(false);
        await loadFromDb(userId);
      } catch (e) {
        console.error("Failed to load data from DB, falling back to local storage:", e);
        setUseLocalFallback(true);
        await loadFromLocal();
      } finally {
        if (active) {
          setIsAppLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [loadFromDb, loadFromLocal, userId]);

  // Local storage is a fallback when DB access is unavailable (offline/unauth).
  const saveData = useCallback(async () => {
    if (isAppLoading || !useLocalFallback) return;
    try {
      const data: PersistedData = {
        isOnboardingComplete,
        currency,
        incomeEntries,
        expenseEntries,
        goals,
        budgets,
        transactions,
        lastBudgetResetMonth,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save data to storage:", e);
    }
  }, [isAppLoading, useLocalFallback, isOnboardingComplete, currency, incomeEntries, expenseEntries, goals, budgets, transactions, lastBudgetResetMonth]);

  useEffect(() => {
    saveData();
  }, [saveData]);

  const weeklySpending = useMemo(() => {
    return calculateWeeklySpending(transactions, selectedWeekOffset);
  }, [transactions, selectedWeekOffset]);

  const currentWeekLabel = useMemo(() => {
    return formatWeekLabel(selectedWeekOffset);
  }, [selectedWeekOffset]);

  const goToPreviousWeek = () => {
    setSelectedWeekOffset((prev) => prev - 1);
  };

  const goToNextWeek = () => {
    if (selectedWeekOffset < 0) {
      setSelectedWeekOffset((prev) => prev + 1);
    }
  };

  const totalIncome = useMemo(() => {
    return incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }, [incomeEntries]);

  const totalFixedExpenses = useMemo(() => {
    return expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }, [expenseEntries]);

  const monthlyBudget = useMemo(() => {
    return totalIncome - totalFixedExpenses;
  }, [totalIncome, totalFixedExpenses]);

  const totalVariableExpenses = useMemo(() => {
    return budgets.reduce((sum, budget) => sum + budget.current, 0);
  }, [budgets]);

  const totalExpenses = useMemo(() => {
    return totalFixedExpenses + totalVariableExpenses;
  }, [totalFixedExpenses, totalVariableExpenses]);

  const balance = useMemo(() => {
    return monthlyBudget - totalVariableExpenses;
  }, [monthlyBudget, totalVariableExpenses]);

  const savingsRate = useMemo(() => {
    if (totalIncome <= 0) return 0;
    const savings = totalIncome - totalExpenses;
    return (savings / totalIncome) * 100;
  }, [totalIncome, totalExpenses]);

  const insightCategories = useMemo(() => {
    const categories: Record<string, number> = {};
    
    budgets.forEach((budget) => {
      const categoryName = budget.name;
      categories[categoryName] = (categories[categoryName] || 0) + budget.current;
    });
    
    const fixedCategories: Record<string, string[]> = {
      "Wohnen": ["Wohnen", "Miete"],
      "Abonnements": ["Netflix", "Spotify", "Handy", "Disney+", "Amazon Prime"],
    };
    
    expenseEntries.forEach((entry) => {
      let matched = false;
      for (const [category, keywords] of Object.entries(fixedCategories)) {
        if (keywords.some((keyword) => entry.type.includes(keyword))) {
          categories[category] = (categories[category] || 0) + entry.amount;
          matched = true;
          break;
        }
      }
      if (!matched) {
        categories["Sonstiges"] = (categories["Sonstiges"] || 0) + entry.amount;
      }
    });
    
    return Object.entries(categories)
      .filter(([_, amount]) => amount > 0)
      .map(([name, amount]) => ({
        name,
        amount,
        color: CATEGORY_COLORS[name] || "#6B7280",
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [budgets, expenseEntries]);

  const GERMAN_MONTHS_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

  const monthlyTrendData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const months: { month: string; monthIndex: number; amount: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      let amount: number;
      
      if (i === 0) {
        amount = totalExpenses;
      } else {
        const baseAmount = totalFixedExpenses;
        const variationFactors = [0.92, 1.08, 0.95, 1.12, 0.88, 1.05];
        const variableBase = totalVariableExpenses * variationFactors[i % variationFactors.length];
        amount = baseAmount + variableBase;
      }
      
      months.push({
        month: GERMAN_MONTHS_SHORT[monthIndex],
        monthIndex,
        amount: Math.round(amount * 100) / 100,
      });
    }
    
    return months;
  }, [totalExpenses, totalFixedExpenses, totalVariableExpenses]);

  const setCurrency = (nextCurrency: CurrencyCode) => {
    setCurrencyState(nextCurrency);
    if (!canUseDb || !userId) return;
    void (async () => {
      const { error } = await supabase
        .from("user_financial_profiles")
        .upsert({ user_id: userId, currency: nextCurrency }, { onConflict: "user_id" });
      if (error) {
        handleDbError(error, "setCurrency");
      }
    })();
  };

  const addIncomeEntry = (type: string, amount: number) => {
    const tempId = generateId();
    setIncomeEntries((prev) => [...prev, { id: tempId, type, amount }]);

    if (!canUseDb || !userId) return;
    void (async () => {
      const { data, error } = await supabase
        .from("income_sources")
        .insert({ user_id: userId, name: type, amount_cents: toCents(amount), currency })
        .select("id, name, amount_cents")
        .single();
      if (error || !data) {
        handleDbError(error ?? new Error("No data returned"), "addIncomeEntry");
        return;
      }
      setIncomeEntries((prev) =>
        prev.map((entry) =>
          entry.id === tempId
            ? { id: data.id, type: data.name, amount: fromCents(data.amount_cents) }
            : entry
        )
      );
    })();
  };

  const addExpenseEntry = (type: string, amount: number) => {
    const tempId = generateId();
    setExpenseEntries((prev) => [...prev, { id: tempId, type, amount }]);

    if (!canUseDb || !userId) return;
    void (async () => {
      const { data, error } = await supabase
        .from("fixed_expenses")
        .insert({ user_id: userId, name: type, amount_cents: toCents(amount), currency })
        .select("id, name, amount_cents")
        .single();
      if (error || !data) {
        handleDbError(error ?? new Error("No data returned"), "addExpenseEntry");
        return;
      }
      setExpenseEntries((prev) =>
        prev.map((entry) =>
          entry.id === tempId
            ? { id: data.id, type: data.name, amount: fromCents(data.amount_cents) }
            : entry
        )
      );
    })();
  };

  const setIncomeEntriesFromOnboarding = (entries: Array<{type: string, amount: number}>) => {
    const localEntries: IncomeEntry[] = entries.map((entry) => ({
      id: generateId(),
      type: entry.type,
      amount: entry.amount,
    }));
    setIncomeEntries(localEntries);

    if (!canUseDb || !userId) return;
    void (async () => {
      const { error: deleteError } = await supabase
        .from("income_sources")
        .delete()
        .eq("user_id", userId);
      if (deleteError) {
        handleDbError(deleteError, "setIncomeEntriesFromOnboarding");
        return;
      }

      if (entries.length === 0) return;
      const { data, error } = await supabase
        .from("income_sources")
        .insert(
          entries.map((entry) => ({
            user_id: userId,
            name: entry.type,
            amount_cents: toCents(entry.amount),
            currency,
          }))
        )
        .select("id, name, amount_cents");
      if (error || !data) {
        handleDbError(error ?? new Error("No data returned"), "setIncomeEntriesFromOnboarding");
        return;
      }
      setIncomeEntries(
        data.map((row) => ({
          id: row.id,
          type: row.name,
          amount: fromCents(row.amount_cents),
        }))
      );
    })();
  };

  const setExpenseEntriesFromOnboarding = (entries: Array<{type: string, amount: number}>) => {
    const localEntries: ExpenseEntry[] = entries.map((entry) => ({
      id: generateId(),
      type: entry.type,
      amount: entry.amount,
    }));
    setExpenseEntries(localEntries);

    if (!canUseDb || !userId) return;
    void (async () => {
      const { error: deleteError } = await supabase
        .from("fixed_expenses")
        .delete()
        .eq("user_id", userId);
      if (deleteError) {
        handleDbError(deleteError, "setExpenseEntriesFromOnboarding");
        return;
      }

      if (entries.length === 0) return;
      const { data, error } = await supabase
        .from("fixed_expenses")
        .insert(
          entries.map((entry) => ({
            user_id: userId,
            name: entry.type,
            amount_cents: toCents(entry.amount),
            currency,
          }))
        )
        .select("id, name, amount_cents");
      if (error || !data) {
        handleDbError(error ?? new Error("No data returned"), "setExpenseEntriesFromOnboarding");
        return;
      }
      setExpenseEntries(
        data.map((row) => ({
          id: row.id,
          type: row.name,
          amount: fromCents(row.amount_cents),
        }))
      );
    })();
  };

  const addGoalDeposit = (goalId: string, amount: number, customDate?: Date) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const depositDate = customDate || new Date();
    const isRepayment = goal.name.toLowerCase().includes("klarna");
    const tempDepositId = generateId();
    const tempTransactionId = generateId();

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const newDeposit: GoalDeposit = {
            id: tempDepositId,
            date: formatDate(depositDate),
            amount,
            type: isRepayment ? "Rückzahlung" : "Einzahlung",
          };
          const newCurrent = g.current + amount;
          const newRemaining = Math.max(0, g.target - newCurrent);
          const updatedDeposits = [newDeposit, ...g.deposits].sort((a, b) => {
            const dateA = parseFormattedDate(a.date);
            const dateB = parseFormattedDate(b.date);
            return dateB.getTime() - dateA.getTime();
          });
          return {
            ...g,
            current: newCurrent,
            remaining: newRemaining,
            deposits: updatedDeposits,
          };
        }
        return g;
      })
    );

    setTransactions((prev) => [
      {
        id: tempTransactionId,
        name: goal.name,
        category: "Sparziel",
        date: formatDate(depositDate),
        amount: -amount,
        icon: "target",
      },
      ...prev,
    ]);

    if (!canUseDb || !userId) return;
    void (async () => {
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: "expense",
          amount_cents: toCents(amount),
          currency,
          name: goal.name,
          category_name: "Sparziel",
          transaction_at: depositDate.toISOString(),
          source: "manual",
        })
        .select("id")
        .single();
      if (transactionError || !transaction) {
        handleDbError(transactionError ?? new Error("No transaction returned"), "addGoalDeposit");
        return;
      }

      const { data: contribution, error: contributionError } = await supabase
        .from("goal_contributions")
        .insert({
          user_id: userId,
          goal_id: goalId,
          amount_cents: toCents(amount),
          currency,
          contribution_type: isRepayment ? "repayment" : "deposit",
          contribution_at: depositDate.toISOString(),
          transaction_id: transaction.id,
        })
        .select("id")
        .single();
      if (contributionError || !contribution) {
        handleDbError(contributionError ?? new Error("No contribution returned"), "addGoalDeposit");
        return;
      }

      setGoals((prev) =>
        prev.map((g) => {
          if (g.id !== goalId) return g;
          return {
            ...g,
            deposits: g.deposits.map((deposit) =>
              deposit.id === tempDepositId ? { ...deposit, id: contribution.id } : deposit
            ),
          };
        })
      );

      setTransactions((prev) =>
        prev.map((tx) => (tx.id === tempTransactionId ? { ...tx, id: transaction.id } : tx))
      );
    })();
  };

  const updateGoalDeposit = (goalId: string, depositId: string, amount: number, date?: Date) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === goalId) {
          const oldDeposit = goal.deposits.find((d) => d.id === depositId);
          if (!oldDeposit) return goal;

          const amountDiff = amount - oldDeposit.amount;
          const updatedDeposits = goal.deposits
            .map((d) => {
              if (d.id === depositId) {
                return {
                  ...d,
                  amount,
                  date: date ? formatDate(date) : d.date,
                };
              }
              return d;
            })
            .sort((a, b) => {
              const dateA = parseFormattedDate(a.date);
              const dateB = parseFormattedDate(b.date);
              return dateB.getTime() - dateA.getTime();
            });

          const newCurrent = goal.current + amountDiff;
          const newRemaining = Math.max(0, goal.target - newCurrent);

          return {
            ...goal,
            current: newCurrent,
            remaining: newRemaining,
            deposits: updatedDeposits,
          };
        }
        return goal;
      })
    );

    if (!canUseDb) return;
    const existingGoal = goals.find((goal) => goal.id === goalId);
    const existingDeposit = existingGoal?.deposits.find((deposit) => deposit.id === depositId);
    const fallbackDate = existingDeposit ? parseFormattedDate(existingDeposit.date) : new Date();
    const contributionAt = date || fallbackDate;
    void (async () => {
      const { error } = await supabase
        .from("goal_contributions")
        .update({
          amount_cents: toCents(amount),
          contribution_at: contributionAt.toISOString(),
        })
        .eq("id", depositId);
      if (error) {
        handleDbError(error, "updateGoalDeposit");
      }
    })();
  };

  const deleteGoalDeposit = (goalId: string, depositId: string) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === goalId) {
          const depositToDelete = goal.deposits.find((d) => d.id === depositId);
          if (!depositToDelete) return goal;

          const newCurrent = goal.current - depositToDelete.amount;
          const newRemaining = Math.max(0, goal.target - newCurrent);

          return {
            ...goal,
            current: Math.max(0, newCurrent),
            remaining: newRemaining,
            deposits: goal.deposits.filter((d) => d.id !== depositId),
          };
        }
        return goal;
      })
    );

    if (!canUseDb) return;
    void (async () => {
      const { error } = await supabase
        .from("goal_contributions")
        .delete()
        .eq("id", depositId);
      if (error) {
        handleDbError(error, "deleteGoalDeposit");
      }
    })();
  };

  const addBudgetExpense = (budgetId: string, amount: number, name: string, customDate?: Date) => {
    const expenseDate = customDate || new Date();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const expenseMonth = expenseDate.getMonth();
    const expenseYear = expenseDate.getFullYear();
    const isCurrentMonth = expenseMonth === currentMonth && expenseYear === currentYear;
    
    const budget = budgets.find((b) => b.id === budgetId);
    if (!budget) return;

    const tempExpenseId = generateId();
    
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.id === budgetId) {
          const newExpense: BudgetExpense = {
            id: tempExpenseId,
            name,
            date: formatDate(expenseDate),
            amount,
            timestamp: expenseDate.getTime(),
          };
          return {
            ...b,
            current: isCurrentMonth ? b.current + amount : b.current,
            expenses: [newExpense, ...b.expenses],
          };
        }
        return b;
      })
    );

    const newTransaction: Transaction = {
      id: tempExpenseId,
      name,
      category: budget.name,
      date: formatDate(expenseDate),
      amount: -amount,
      icon: budget.icon,
      timestamp: expenseDate.getTime(),
    };
    setTransactions((prev) => [newTransaction, ...prev]);

    if (!canUseDb || !userId) return;
    void (async () => {
      const category = resolveBudgetCategory(budget.name);
      if (!category) {
        handleDbError(new Error(`Missing budget category for ${budget.name}`), "addBudgetExpense");
        return;
      }

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: "expense",
          amount_cents: toCents(amount),
          currency,
          name,
          category_name: budget.name,
          budget_id: budget.id,
          budget_category_id: category.id,
          transaction_at: expenseDate.toISOString(),
          source: "manual",
        })
        .select("id")
        .single();
      if (error || !data) {
        handleDbError(error ?? new Error("No transaction returned"), "addBudgetExpense");
        return;
      }

      setBudgets((prev) =>
        prev.map((b) => {
          if (b.id !== budgetId) return b;
          return {
            ...b,
            expenses: b.expenses.map((expense) =>
              expense.id === tempExpenseId ? { ...expense, id: data.id } : expense
            ),
          };
        })
      );

      setTransactions((prev) =>
        prev.map((tx) => (tx.id === tempExpenseId ? { ...tx, id: data.id } : tx))
      );
    })();
  };

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const tempId = generateId();
    const newTransaction: Transaction = {
      ...transaction,
      id: tempId,
    };
    setTransactions((prev) => [newTransaction, ...prev]);

    if (!canUseDb || !userId) return;
    void (async () => {
      const isExpense = transaction.amount < 0;
      const transactionAt = parseFormattedDate(transaction.date);
      const category = isExpense ? resolveBudgetCategory(transaction.category) : null;
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: isExpense ? "expense" : "income",
          amount_cents: toCents(Math.abs(transaction.amount)),
          currency,
          name: transaction.name,
          category_name: transaction.category,
          budget_category_id: category?.id ?? null,
          transaction_at: transactionAt.toISOString(),
          source: "manual",
        })
        .select("id")
        .single();
      if (error || !data) {
        handleDbError(error ?? new Error("No transaction returned"), "addTransaction");
        return;
      }
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === tempId ? { ...tx, id: data.id } : tx))
      );
    })();
  };

  const completeOnboarding = () => {
    setIsOnboardingComplete(true);
    if (!canUseDb || !userId) return;
    void (async () => {
      const { error } = await supabase
        .from("user_onboarding")
        .upsert(
          {
            user_id: userId,
            onboarding_version: ONBOARDING_VERSION,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      if (error) {
        handleDbError(error, "completeOnboarding");
      }
    })();
  };

  const updateGoal = (goalId: string, updates: Partial<Goal>) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === goalId) {
          return { ...goal, ...updates };
        }
        return goal;
      })
    );

    if (!canUseDb) return;
    void (async () => {
      const payload: Record<string, unknown> = {};
      if (typeof updates.name === "string") payload.name = updates.name;
      if (typeof updates.icon === "string") payload.icon = updates.icon;
      if (typeof updates.target === "number") payload.target_amount_cents = toCents(updates.target);
      if (Object.keys(payload).length === 0) return;
      const { error } = await supabase.from("goals").update(payload).eq("id", goalId);
      if (error) {
        handleDbError(error, "updateGoal");
      }
    })();
  };

  const updateBudget = (budgetId: string, updates: Partial<Budget>) => {
    setBudgets((prev) =>
      prev.map((budget) => {
        if (budget.id === budgetId) {
          return { ...budget, ...updates };
        }
        return budget;
      })
    );

    if (!canUseDb) return;
    void (async () => {
      const payload: Record<string, unknown> = {};
      if (typeof updates.name === "string") payload.name = updates.name;
      if (typeof updates.limit === "number") payload.limit_amount_cents = toCents(updates.limit);
      if (Object.keys(payload).length === 0) return;
      const { error } = await supabase.from("budgets").update(payload).eq("id", budgetId);
      if (error) {
        handleDbError(error, "updateBudget");
      }
    })();
  };

  const addGoal = (name: string, icon: string, target: number) => {
    const tempId = generateId();
    const newGoal: Goal = {
      id: tempId,
      name,
      icon,
      target,
      current: 0,
      remaining: target,
      deposits: [],
    };
    setGoals((prev) => [...prev, newGoal]);

    if (!canUseDb || !userId) return;
    void (async () => {
      const { data, error } = await supabase
        .from("goals")
        .insert({
          user_id: userId,
          name,
          icon,
          target_amount_cents: toCents(target),
          monthly_contribution_cents: null,
          created_in_onboarding: !isOnboardingComplete,
        })
        .select("id")
        .single();
      if (error || !data) {
        handleDbError(error ?? new Error("No goal returned"), "addGoal");
        return;
      }
      setGoals((prev) =>
        prev.map((goal) => (goal.id === tempId ? { ...goal, id: data.id } : goal))
      );
    })();
  };

  const addBudget = (name: string, icon: string, iconColor: string, limit: number) => {
    const tempId = generateId();
    const newBudget: Budget = {
      id: tempId,
      name,
      icon,
      iconColor,
      limit,
      current: 0,
      expenses: [],
    };
    setBudgets((prev) => [...prev, newBudget]);

    if (!canUseDb || !userId) return;
    void (async () => {
      const category = resolveBudgetCategory(name);
      if (!category) {
        handleDbError(new Error(`Missing budget category for ${name}`), "addBudget");
        return;
      }
      const { data, error } = await supabase
        .from("budgets")
        .insert({
          user_id: userId,
          category_id: category.id,
          name,
          limit_amount_cents: toCents(limit),
          period: "monthly",
          currency,
          is_active: true,
        })
        .select("id")
        .single();
      if (error || !data) {
        handleDbError(error ?? new Error("No budget returned"), "addBudget");
        return;
      }
      setBudgets((prev) =>
        prev.map((budget) => (budget.id === tempId ? { ...budget, id: data.id } : budget))
      );
    })();
  };

  const addExpenseWithAutobudget = (categoryName: string, icon: string, amount: number, name: string, date: Date) => {
    const categoryColors: Record<string, string> = {
      "Lebensmittel": "#3B5BDB",
      "Transport": "#7B8CDE",
      "Unterhaltung": "#5C7CFA",
      "Shopping": "#748FFC",
      "Restaurant": "#91A7FF",
      "Gesundheit": "#BAC8FF",
      "Hygiene": "#B8C4E9",
      "Feiern": "#9D4EDD",
      "Sonstiges": "#DBE4FF",
    };

    const dbCategory = canUseDb ? resolveBudgetCategory(categoryName) : null;
    if (canUseDb && !dbCategory) {
      addTransaction({
        name,
        category: categoryName,
        date: formatDate(date),
        amount: -amount,
        icon,
      });
      return;
    }

    const existingBudget = budgets.find(
      (b) => b.name.toLowerCase() === categoryName.toLowerCase()
    );
    const tempBudgetId = existingBudget?.id ?? generateId();
    const tempExpenseId = generateId();

    setBudgets((prevBudgets) => {
      if (existingBudget) {
        const newExpense: BudgetExpense = {
          id: tempExpenseId,
          name,
          date: formatDate(date),
          amount,
        };
        return prevBudgets.map((b) => {
          if (b.id === existingBudget.id) {
            return {
              ...b,
              current: b.current + amount,
              expenses: [newExpense, ...b.expenses],
            };
          }
          return b;
        });
      }

      const iconColor = categoryColors[categoryName] || "#7340fd";
      const newExpense: BudgetExpense = {
        id: tempExpenseId,
        name,
        date: formatDate(date),
        amount,
      };
      const newBudget: Budget = {
        id: tempBudgetId,
        name: categoryName,
        icon,
        iconColor,
        limit: 0,
        current: amount,
        expenses: [newExpense],
      };

      return [...prevBudgets, newBudget];
    });

    setTransactions((prev) => [
      {
        id: tempExpenseId,
        name,
        category: categoryName,
        date: formatDate(date),
        amount: -amount,
        icon,
      },
      ...prev,
    ]);

    if (!canUseDb || !userId) return;
    void (async () => {
      let budgetId = existingBudget?.id;
      if (!budgetId) {
        const { data: budgetData, error: budgetError } = await supabase
          .from("budgets")
          .insert({
            user_id: userId,
            category_id: dbCategory?.id,
            name: categoryName,
            limit_amount_cents: 0,
            period: "monthly",
            currency,
            is_active: true,
          })
          .select("id")
          .single();
        if (budgetError || !budgetData) {
          handleDbError(budgetError ?? new Error("No budget returned"), "addExpenseWithAutobudget");
          return;
        }
        budgetId = budgetData.id;
        setBudgets((prev) =>
          prev.map((budget) => (budget.id === tempBudgetId ? { ...budget, id: budgetId } : budget))
        );
      }

      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: "expense",
          amount_cents: toCents(amount),
          currency,
          name,
          category_name: categoryName,
          budget_id: budgetId,
          budget_category_id: dbCategory?.id ?? null,
          transaction_at: date.toISOString(),
          source: "manual",
        })
        .select("id")
        .single();
      if (transactionError || !transaction) {
        handleDbError(transactionError ?? new Error("No transaction returned"), "addExpenseWithAutobudget");
        return;
      }

      setBudgets((prev) =>
        prev.map((budget) => {
          if (budget.id !== (budgetId ?? tempBudgetId)) return budget;
          return {
            ...budget,
            expenses: budget.expenses.map((expense) =>
              expense.id === tempExpenseId ? { ...expense, id: transaction.id } : expense
            ),
          };
        })
      );

      setTransactions((prev) =>
        prev.map((tx) => (tx.id === tempExpenseId ? { ...tx, id: transaction.id } : tx))
      );
    })();
  };

  const updateIncomeEntry = (id: string, type: string, amount: number) => {
    setIncomeEntries((prev) =>
      prev.map((entry) => {
        if (entry.id === id) {
          return { ...entry, type, amount };
        }
        return entry;
      })
    );

    if (!canUseDb) return;
    void (async () => {
      const { error } = await supabase
        .from("income_sources")
        .update({ name: type, amount_cents: toCents(amount) })
        .eq("id", id);
      if (error) {
        handleDbError(error, "updateIncomeEntry");
      }
    })();
  };

  const deleteIncomeEntry = (id: string) => {
    setIncomeEntries((prev) => prev.filter((entry) => entry.id !== id));

    if (!canUseDb) return;
    void (async () => {
      const { error } = await supabase.from("income_sources").delete().eq("id", id);
      if (error) {
        handleDbError(error, "deleteIncomeEntry");
      }
    })();
  };

  const updateExpenseEntry = (id: string, type: string, amount: number) => {
    setExpenseEntries((prev) =>
      prev.map((entry) => {
        if (entry.id === id) {
          return { ...entry, type, amount };
        }
        return entry;
      })
    );

    if (!canUseDb) return;
    void (async () => {
      const { error } = await supabase
        .from("fixed_expenses")
        .update({ name: type, amount_cents: toCents(amount) })
        .eq("id", id);
      if (error) {
        handleDbError(error, "updateExpenseEntry");
      }
    })();
  };

  const deleteExpenseEntry = (id: string) => {
    setExpenseEntries((prev) => prev.filter((entry) => entry.id !== id));

    if (!canUseDb) return;
    void (async () => {
      const { error } = await supabase.from("fixed_expenses").delete().eq("id", id);
      if (error) {
        handleDbError(error, "deleteExpenseEntry");
      }
    })();
  };

  const updateBudgetExpense = (budgetId: string, expenseId: string, amount: number, name: string, date?: Date) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    setBudgets((prev) =>
      prev.map((budget) => {
        if (budget.id === budgetId) {
          const oldExpense = budget.expenses.find((e) => e.id === expenseId);
          if (!oldExpense) return budget;
          
          const oldTimestamp = oldExpense.timestamp || parseFormattedDate(oldExpense.date).getTime();
          const oldDate = new Date(oldTimestamp);
          const wasInCurrentMonth = oldDate.getMonth() === currentMonth && oldDate.getFullYear() === currentYear;
          
          const newDate = date || new Date(oldTimestamp);
          const isInCurrentMonth = newDate.getMonth() === currentMonth && newDate.getFullYear() === currentYear;
          
          let currentDiff = 0;
          if (wasInCurrentMonth && isInCurrentMonth) {
            currentDiff = amount - oldExpense.amount;
          } else if (wasInCurrentMonth && !isInCurrentMonth) {
            currentDiff = -oldExpense.amount;
          } else if (!wasInCurrentMonth && isInCurrentMonth) {
            currentDiff = amount;
          }
          
          const updatedExpenses = budget.expenses.map((e) => {
            if (e.id === expenseId) {
              return {
                ...e,
                amount,
                name,
                date: date ? formatDate(date) : e.date,
                timestamp: date ? date.getTime() : e.timestamp,
              };
            }
            return e;
          });
          
          return {
            ...budget,
            current: Math.max(0, budget.current + currentDiff),
            expenses: updatedExpenses,
          };
        }
        return budget;
      })
    );

    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === expenseId) {
          return { ...tx, amount: -amount, name, date: date ? formatDate(date) : tx.date };
        }
        return tx;
      })
    );

    if (!canUseDb) return;
    const existingBudget = budgets.find((b) => b.id === budgetId);
    const existingExpense = existingBudget?.expenses.find((e) => e.id === expenseId);
    const fallbackTimestamp =
      existingExpense?.timestamp ?? (existingExpense ? parseFormattedDate(existingExpense.date).getTime() : Date.now());
    const transactionDate = date || new Date(fallbackTimestamp);
    void (async () => {
      const { error } = await supabase
        .from("transactions")
        .update({
          amount_cents: toCents(amount),
          name,
          transaction_at: transactionDate.toISOString(),
        })
        .eq("id", expenseId);
      if (error) {
        handleDbError(error, "updateBudgetExpense");
      }
    })();
  };

  const deleteBudgetExpense = (budgetId: string, expenseId: string) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.id === budgetId) {
          const expenseToDelete = b.expenses.find((e) => e.id === expenseId);
          if (!expenseToDelete) return b;
          
          const expenseTimestamp = expenseToDelete.timestamp || parseFormattedDate(expenseToDelete.date).getTime();
          const expenseDate = new Date(expenseTimestamp);
          const isCurrentMonth = expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
          
          return {
            ...b,
            current: isCurrentMonth ? Math.max(0, b.current - expenseToDelete.amount) : b.current,
            expenses: b.expenses.filter((e) => e.id !== expenseId),
          };
        }
        return b;
      })
    );

    setTransactions((prev) => prev.filter((tx) => tx.id !== expenseId));

    if (!canUseDb) return;
    void (async () => {
      const { error } = await supabase.from("transactions").delete().eq("id", expenseId);
      if (error) {
        handleDbError(error, "deleteBudgetExpense");
      }
    })();
  };

  const updateTransaction = (transactionId: string, updates: Partial<Omit<Transaction, "id">>) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === transactionId) {
          return { ...tx, ...updates };
        }
        return tx;
      })
    );

    if (!canUseDb) return;
    void (async () => {
      const payload: Record<string, unknown> = {};
      if (typeof updates.name === "string") payload.name = updates.name;
      if (typeof updates.category === "string") payload.category_name = updates.category;
      if (typeof updates.amount === "number") {
        payload.amount_cents = toCents(Math.abs(updates.amount));
        payload.type = updates.amount < 0 ? "expense" : "income";
      }
      if (typeof updates.date === "string") {
        const transactionDate = parseFormattedDate(updates.date);
        payload.transaction_at = transactionDate.toISOString();
      }
      if (Object.keys(payload).length === 0) return;
      const { error } = await supabase.from("transactions").update(payload).eq("id", transactionId);
      if (error) {
        handleDbError(error, "updateTransaction");
      }
    })();
  };

  const deleteTransaction = (transactionId: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== transactionId));

    if (!canUseDb) return;
    void (async () => {
      const { error } = await supabase.from("transactions").delete().eq("id", transactionId);
      if (error) {
        handleDbError(error, "deleteTransaction");
      }
    })();
  };

  const deleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));

    if (!canUseDb) return;
    void (async () => {
      const { error } = await supabase.from("goals").delete().eq("id", goalId);
      if (error) {
        handleDbError(error, "deleteGoal");
      }
    })();
  };

  const deleteBudget = (budgetId: string) => {
    const budget = budgets.find((b) => b.id === budgetId);
    if (budget) {
      setTransactions((prev) => prev.filter((tx) => tx.category !== budget.name));
    }
    setBudgets((prev) => prev.filter((b) => b.id !== budgetId));

    if (!canUseDb) return;
    void (async () => {
      const { error: txError } = await supabase
        .from("transactions")
        .delete()
        .eq("budget_id", budgetId);
      if (txError) {
        handleDbError(txError, "deleteBudget");
        return;
      }
      const { error } = await supabase.from("budgets").delete().eq("id", budgetId);
      if (error) {
        handleDbError(error, "deleteBudget");
      }
    })();
  };

  const resetMonthlyBudgets = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    if (currentMonth !== lastBudgetResetMonth) {
      setBudgets((prev) =>
        prev.map((budget) => {
          const currentMonthExpenses = budget.expenses.filter((expense) => {
            const timestamp = expense.timestamp || parseFormattedDate(expense.date).getTime();
            const expenseDate = new Date(timestamp);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
          });
          const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
          return {
            ...budget,
            current: currentMonthTotal,
          };
        })
      );
      setLastBudgetResetMonth(currentMonth);
    }
  };

  React.useEffect(() => {
    if (isAppLoading) return;
    const currentMonth = new Date().getMonth();
    if (currentMonth !== lastBudgetResetMonth) {
      resetMonthlyBudgets();
    }
  }, [lastBudgetResetMonth, isAppLoading]);

  const resetAllData = async () => {
    try {
      if (canUseDb && userId) {
        await supabase.from("goal_contributions").delete().eq("user_id", userId);
        await supabase.from("transactions").delete().eq("user_id", userId);
        await supabase.from("goals").delete().eq("user_id", userId);
        await supabase.from("budgets").delete().eq("user_id", userId);
        await supabase.from("income_sources").delete().eq("user_id", userId);
        await supabase.from("fixed_expenses").delete().eq("user_id", userId);
        await supabase.from("user_financial_profiles").delete().eq("user_id", userId);
        await supabase
          .from("user_onboarding")
          .update({ completed_at: null })
          .eq("user_id", userId);
      }
      await AsyncStorage.removeItem(STORAGE_KEY);
      setIsOnboardingComplete(false);
      setCurrencyState("EUR");
      setIncomeEntries([]);
      setExpenseEntries([]);
      setGoals([]);
      setBudgets([]);
      setTransactions([]);
      setLastBudgetResetMonth(-1);
    } catch (e) {
      console.error("Failed to reset data:", e);
    }
  };

  const value: AppContextType = {
    isOnboardingComplete,
    isAppLoading,
    userName,
    currency,
    incomeEntries,
    expenseEntries,
    goals,
    budgets,
    weeklySpending,
    transactions,
    insightCategories,
    totalIncome,
    totalFixedExpenses,
    totalVariableExpenses,
    totalExpenses,
    monthlyBudget,
    balance,
    savingsRate,
    monthlyTrendData,
    selectedWeekOffset,
    currentWeekLabel,
    addIncomeEntry,
    addExpenseEntry,
    setIncomeEntries: setIncomeEntriesFromOnboarding,
    setExpenseEntries: setExpenseEntriesFromOnboarding,
    setCurrency,
    addGoalDeposit,
    updateGoalDeposit,
    deleteGoalDeposit,
    addBudgetExpense,
    updateBudgetExpense,
    deleteBudgetExpense,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    completeOnboarding,
    updateGoal,
    deleteGoal,
    updateBudget,
    deleteBudget,
    addGoal,
    addBudget,
    addExpenseWithAutobudget,
    updateIncomeEntry,
    deleteIncomeEntry,
    updateExpenseEntry,
    deleteExpenseEntry,
    goToPreviousWeek,
    goToNextWeek,
    resetMonthlyBudgets,
    lastBudgetResetMonth,
    resetAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

export default AppContext;
