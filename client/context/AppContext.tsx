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
import type { BudgetCategoryRow, IncomeCategoryRow } from "@/services/types";
import type { XpLevelUpPayloadT } from "@/types/xp-types";
import { formatDate } from "@/utils/dates";
import { upsertInitialSavings } from "@/services/app-service";
import {
  useOnboardingStore,
  type OnboardingStoreT,
} from "@/stores/onboarding-store";
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
import { useIncomeCategoryResolver } from "@/context/app/hooks/use-income-category-resolver";

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
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategoryRow[]>(
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
    setIncomeCategories,
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
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    setUseLocalFallback(true);
  }, []);
  const { resolveBudgetCategory } = useBudgetCategoryResolver({
    budgetCategories,
  });
  const { resolveIncomeCategory } = useIncomeCategoryResolver({
    incomeCategories,
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
    transactionIncomeTotal,
    transactionExpenseTotal,
    transactionBalance,
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
      transactions,
      setTransactions,
      resolveBudgetCategory,
      resolveIncomeCategory,
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
    deleteTransaction,
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

  const submitOnboarding = useCallback(() => {
    const {
      initialSavingsAmount,
      incomeEntries,
      expenseEntries,
      goalDraft,
      budgetEntries,
      isSubmitting,
      hasSubmitted,
      setIsSubmitting,
      setHasSubmitted,
      resetDrafts,
    } = useOnboardingStore.getState() as OnboardingStoreT;

    if (isSubmitting || hasSubmitted) return;
    setIsSubmitting(true);
    setHasSubmitted(true);

    if (typeof initialSavingsAmount === "number" && initialSavingsAmount > 0) {
      const incomeCategory = incomeCategories.find(
        (category) => category.name.toLowerCase() === "sonstiges",
      );
      const icon = incomeCategory?.icon ?? "more-horizontal";

      addTransaction({
        name: "Ersparnisse",
        category: "Sonstiges",
        date: formatDate(new Date()),
        amount: initialSavingsAmount,
        icon,
        source: "onboarding",
      });

      if (canUseDb && userId) {
        void (async () => {
          try {
            await upsertInitialSavings(userId, initialSavingsAmount, currency);
          } catch (error) {
            handleDbError(error, "submitOnboarding.savings");
          }
        })();
      }
    }

    setIncomeEntriesFromOnboarding(incomeEntries);
    setExpenseEntriesFromOnboarding(expenseEntries);

    if (goalDraft) {
      addGoal(
        goalDraft.name,
        goalDraft.icon,
        goalDraft.target,
        goalDraft.monthlyContribution,
      );
    }

    if (budgetEntries.length > 0) {
      budgetEntries.forEach((entry) => {
        const category = budgetCategories.find((c) => c.name === entry.name);
        const icon = category?.icon ?? "circle";
        const color = category?.color ?? "#6B7280";
        addBudget(entry.name, icon, color, entry.limit);
      });
    }

    resetDrafts();
    setIsSubmitting(false);
  }, [
    addBudget,
    addGoal,
    addTransaction,
    budgetCategories,
    canUseDb,
    currency,
    handleDbError,
    incomeCategories,
    setExpenseEntriesFromOnboarding,
    setIncomeEntriesFromOnboarding,
    userId,
  ]);

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
    transactionIncomeTotal,
    transactionExpenseTotal,
    transactionBalance,
    savingsRate,
    monthlyTrendData,
    budgetCategories,
    incomeCategories,
    selectedWeekOffset,
    currentWeekLabel,
    levels,
    xpEventTypes,
    xpEventRules,
    userProgress,
    pendingLevelUps,
    submitOnboarding,
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
