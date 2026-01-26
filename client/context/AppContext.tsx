import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import {
  INITIAL_BUDGETS,
  INITIAL_EXPENSE_ENTRIES,
  INITIAL_GOALS,
  INITIAL_INCOME_ENTRIES,
  INITIAL_TRANSACTIONS,
  ONBOARDING_VERSION,
} from "@/context/app/constants";
import type {
  AppContextType,
  Budget,
  CurrencyCode,
  ExpenseEntry,
  Goal,
  IncomeEntry,
  PersistedData,
  Transaction,
} from "@/context/app/types";
import {
  updateOnboardingComplete,
  upsertUserCurrency,
} from "@/services/app-service";
import type { BudgetCategoryRow } from "@/services/types";
import { parseFormattedDate } from "@/utils/dates";
import type { UserProgressT } from "@/types/xp-types";
import { useAppDerivedState } from "@/context/app/hooks/use-app-derived-state";
import { useEntryActions } from "@/context/app/hooks/use-entry-actions";
import { useTransactionActions } from "@/context/app/hooks/use-transaction-actions";
import { useGoalActions } from "@/context/app/hooks/use-goal-actions";
import { useBudgetActions } from "@/context/app/hooks/use-budget-actions";
import { useAppDataLoader } from "@/context/app/hooks/use-app-data-loader";
import { useAppPersistence } from "@/context/app/hooks/use-app-persistence";
import { useXp } from "@/context/app/hooks/use-xp";

export type {
  AppContextType,
  Budget,
  BudgetExpense,
  CurrencyCode,
  ExpenseEntry,
  Goal,
  GoalDeposit,
  IncomeEntry,
  PersistedData,
  Transaction,
} from "@/context/app/types";

const AppContext = createContext<AppContextType | undefined>(undefined);

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [currency, setCurrencyState] = useState<CurrencyCode>("EUR");
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(
    INITIAL_INCOME_ENTRIES,
  );
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>(
    INITIAL_EXPENSE_ENTRIES,
  );
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [transactions, setTransactions] =
    useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [lastBudgetResetMonth, setLastBudgetResetMonth] = useState(() =>
    new Date().getMonth(),
  );
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategoryRow[]>(
    [],
  );

  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { useLocalFallback, setUseLocalFallback } = useAppDataLoader({
    userId,
    onboardingVersion: ONBOARDING_VERSION,
    setIsAppLoading,
    setIsOnboardingComplete,
    setUserName,
    setCurrencyState,
    setIncomeEntries,
    setExpenseEntries,
    setGoals,
    setBudgets,
    setTransactions,
    setBudgetCategories,
    setLastBudgetResetMonth,
  });
  const canUseDb = Boolean(userId) && !useLocalFallback;

  const { levels, xpEventTypes, xpEventRules, userProgress, awardXp } = useXp({
    userId,
    canUseDb,
  });

  const budgetCategoryByName = useMemo(() => {
    const map = new Map<string, BudgetCategoryRow>();
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

  const {
    weeklySpending,
    currentWeekLabel,
    totalIncome,
    totalFixedExpenses,
    totalVariableExpenses,
    totalExpenses,
    monthlyBudget,
    balance,
    savingsRate,
    insightCategories,
    monthlyTrendData,
  } = useAppDerivedState({
    incomeEntries,
    expenseEntries,
    budgets,
    transactions,
    selectedWeekOffset,
  });

  const persistedData = useMemo<PersistedData>(
    () => ({
      isOnboardingComplete,
      currency,
      incomeEntries,
      expenseEntries,
      goals,
      budgets,
      transactions,
      lastBudgetResetMonth,
    }),
    [
      budgets,
      currency,
      expenseEntries,
      goals,
      incomeEntries,
      isOnboardingComplete,
      lastBudgetResetMonth,
      transactions,
    ],
  );

  useAppPersistence({
    isAppLoading,
    useLocalFallback,
    data: persistedData,
  });

  const goToPreviousWeek = () => {
    setSelectedWeekOffset((prev) => prev - 1);
  };

  const goToNextWeek = () => {
    if (selectedWeekOffset < 0) {
      setSelectedWeekOffset((prev) => prev + 1);
    }
  };

  const setCurrency = (nextCurrency: CurrencyCode) => {
    setCurrencyState(nextCurrency);
    if (!canUseDb || !userId) return;
    void (async () => {
      try {
        await upsertUserCurrency(userId, nextCurrency);
      } catch (error) {
        handleDbError(error, "setCurrency");
      }
    })();
  };

  const completeOnboarding = useCallback(() => {
    setIsOnboardingComplete(true);
    if (!canUseDb || !userId) return;
    void (async () => {
      try {
        await updateOnboardingComplete(userId, ONBOARDING_VERSION);
      } catch (error) {
        handleDbError(error, "completeOnboarding");
      }
    })();
  }, [canUseDb, handleDbError, userId]);

  const handleSnapXp = useCallback(
    async (transactionId: string): Promise<UserProgressT | null> => {
      const updatedProgress = await awardXp({
        eventKey: "snap_created",
        sourceType: "transaction",
        sourceId: transactionId,
      });

      if (!isOnboardingComplete) return updatedProgress ?? null;
      const tutorialProgress = await awardXp({
        eventKey: "first_snap_tutorial",
        sourceType: "transaction",
        sourceId: transactionId,
        progressOverride: updatedProgress ?? null,
      });
      return tutorialProgress ?? updatedProgress ?? null;
    },
    [awardXp, isOnboardingComplete],
  );

  const {
    addIncomeEntry,
    addExpenseEntry,
    setIncomeEntriesFromOnboarding,
    setExpenseEntriesFromOnboarding,
    updateIncomeEntry,
    deleteIncomeEntry,
    updateExpenseEntry,
    deleteExpenseEntry,
  } = useEntryActions({
    userId,
    canUseDb,
    currency,
    setIncomeEntries,
    setExpenseEntries,
    handleDbError,
  });

  const { addTransaction, updateTransaction, deleteTransaction } =
    useTransactionActions({
      userId,
      canUseDb,
      currency,
      setTransactions,
      resolveBudgetCategory,
      handleDbError,
      handleSnapXp,
    });

  const {
    addGoalDeposit,
    updateGoalDeposit,
    deleteGoalDeposit,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useGoalActions({
    userId,
    canUseDb,
    currency,
    isOnboardingComplete,
    goals,
    setGoals,
    setTransactions,
    handleDbError,
    handleSnapXp,
    awardXp,
  });

  const {
    addBudgetExpense,
    updateBudgetExpense,
    deleteBudgetExpense,
    updateBudget,
    addBudget,
    addExpenseWithAutobudget,
    deleteBudget,
  } = useBudgetActions({
    userId,
    canUseDb,
    currency,
    budgets,
    setBudgets,
    setTransactions,
    resolveBudgetCategory,
    handleDbError,
    handleSnapXp,
    addTransaction,
  });

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
  }, [lastBudgetResetMonth]);

  useEffect(() => {
    if (isAppLoading) return;
    const currentMonth = new Date().getMonth();
    if (currentMonth !== lastBudgetResetMonth) {
      resetMonthlyBudgets();
    }
  }, [lastBudgetResetMonth, isAppLoading, resetMonthlyBudgets]);


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
    levels,
    xpEventTypes,
    xpEventRules,
    userProgress,
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
