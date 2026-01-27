import React, {
  createContext,
  useContext,
  useState,
  useMemo,
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
  MonthlyTrendData,
  PersistedData,
  Transaction,
} from "@/context/app/types";
import type { BudgetCategoryRow } from "@/services/types";
import type { XpLevelUpPayloadT } from "@/types/xp-types";
import { useAppDerivedState } from "@/context/app/hooks/use-app-derived-state";
import { useEntryActions } from "@/context/app/hooks/use-entry-actions";
import { useTransactionActions } from "@/context/app/hooks/use-transaction-actions";
import { useGoalActions } from "@/context/app/hooks/use-goal-actions";
import { useBudgetActions } from "@/context/app/hooks/use-budget-actions";
import { useAppDataLoader } from "@/context/app/hooks/use-app-data-loader";
import { useAppPersistence } from "@/context/app/hooks/use-app-persistence";
import { useXp } from "@/context/app/hooks/use-xp";
import { useBudgetCategoryResolver } from "@/context/app/hooks/use-budget-category-resolver";
import { useWeekNavigation } from "@/context/app/hooks/use-week-navigation";
import { useCurrencyActions } from "@/context/app/hooks/use-currency-actions";
import { useOnboardingActions } from "@/context/app/hooks/use-onboarding-actions";
import { useSnapXp } from "@/context/app/hooks/use-snap-xp";
import { useMonthlyBudgetReset } from "@/context/app/hooks/use-monthly-budget-reset";

export type {
  AppContextType,
  Budget,
  BudgetExpense,
  CurrencyCode,
  ExpenseEntry,
  Goal,
  GoalDeposit,
  IncomeEntry,
  MonthlyTrendData,
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
  const [monthlyTrendData, setMonthlyTrendData] = useState<MonthlyTrendData[]>(
    [],
  );
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [lastBudgetResetMonth, setLastBudgetResetMonth] = useState(() =>
    new Date().getMonth(),
  );
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategoryRow[]>(
    [],
  );
  const [pendingLevelUps, setPendingLevelUps] = useState<XpLevelUpPayloadT[]>(
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
    setMonthlyTrendData,
    setBudgetCategories,
    setLastBudgetResetMonth,
  });
  const canUseDb = Boolean(userId) && !useLocalFallback;

  const enqueueLevelUp = useCallback((payload: XpLevelUpPayloadT) => {
    setPendingLevelUps((prev) => [...prev, payload]);
  }, []);

  const consumeNextLevelUp = useCallback(() => {
    setPendingLevelUps((prev) => prev.slice(1));
  }, []);

  const { levels, xpEventTypes, xpEventRules, userProgress, awardXp } = useXp({
    userId,
    canUseDb,
    onLevelUp: enqueueLevelUp,
  });

  const handleDbError = useCallback((error: unknown, context: string) => {
    console.error(`DB error during ${context}:`, error);
    setUseLocalFallback(true);
  }, []);
  const { resolveBudgetCategory } = useBudgetCategoryResolver({
    budgetCategories,
  });

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

  const { goToPreviousWeek, goToNextWeek } = useWeekNavigation({
    selectedWeekOffset,
    setSelectedWeekOffset,
  });

  const { setCurrency } = useCurrencyActions({
    userId,
    canUseDb,
    setCurrencyState,
    handleDbError,
  });

  const { completeOnboarding } = useOnboardingActions({
    userId,
    canUseDb,
    setIsOnboardingComplete,
    handleDbError,
  });

  const { handleSnapXp } = useSnapXp({
    isOnboardingComplete,
    awardXp,
  });

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

  const { resetMonthlyBudgets } = useMonthlyBudgetReset({
    budgets,
    isAppLoading,
    lastBudgetResetMonth,
    setBudgets,
    setLastBudgetResetMonth,
  });


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
    pendingLevelUps,
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
    enqueueLevelUp,
    consumeNextLevelUp,
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
