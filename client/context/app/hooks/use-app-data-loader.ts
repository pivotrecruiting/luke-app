import { useCallback, useEffect, useState } from "react";
import type {
  Budget,
  CurrencyCode,
  ExpenseEntry,
  Goal,
  IncomeEntry,
  MonthlyTrendData,
  Transaction,
} from "@/context/app/types";
import { fetchAppData } from "@/services/app-service";
import type { BudgetCategoryRow, IncomeCategoryRow } from "@/services/types";
import { loadPersistedData } from "@/services/local-storage";

type UseAppDataLoaderParamsT = {
  userId: string | null;
  onboardingVersion: string;
  setIsAppLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsOnboardingComplete: React.Dispatch<React.SetStateAction<boolean>>;
  setUserName: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrencyState: React.Dispatch<React.SetStateAction<CurrencyCode>>;
  setIncomeEntries: React.Dispatch<React.SetStateAction<IncomeEntry[]>>;
  setExpenseEntries: React.Dispatch<React.SetStateAction<ExpenseEntry[]>>;
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setMonthlyTrendData: React.Dispatch<React.SetStateAction<MonthlyTrendData[]>>;
  setBudgetCategories: React.Dispatch<
    React.SetStateAction<BudgetCategoryRow[]>
  >;
  setIncomeCategories: React.Dispatch<
    React.SetStateAction<IncomeCategoryRow[]>
  >;
  setLastBudgetResetMonth: React.Dispatch<React.SetStateAction<number>>;
};

/**
 * Loads app data from DB or local storage and manages fallback state.
 */
export const useAppDataLoader = ({
  userId,
  onboardingVersion,
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
}: UseAppDataLoaderParamsT) => {
  const [useLocalFallback, setUseLocalFallback] = useState(false);

  const loadFromLocal = useCallback(async () => {
    try {
      setUserName(null);
      const data = await loadPersistedData();
      if (!data) return;
      setIsOnboardingComplete(data.isOnboardingComplete ?? false);
      if (data.currency) {
        setCurrencyState(data.currency);
      }
      setIncomeEntries(data.incomeEntries ?? []);
      setExpenseEntries(data.expenseEntries ?? []);
      setGoals(data.goals ?? []);
      setBudgets(data.budgets ?? []);
      setTransactions(data.transactions ?? []);
      setMonthlyTrendData([]);
      setBudgetCategories([]);
      setIncomeCategories([]);
      if (data.lastBudgetResetMonth !== undefined) {
        setLastBudgetResetMonth(data.lastBudgetResetMonth);
      }
    } catch (e) {
      console.error("Failed to load data from storage:", e);
    }
  }, [
    setBudgets,
    setCurrencyState,
    setExpenseEntries,
    setGoals,
    setIncomeEntries,
    setIsOnboardingComplete,
    setLastBudgetResetMonth,
    setTransactions,
    setUserName,
  ]);

  const loadFromDb = useCallback(
    async (id: string) => {
      const data = await fetchAppData(id, onboardingVersion);
      setIsOnboardingComplete(data.isOnboardingComplete);
      if (data.currency) {
        setCurrencyState(data.currency);
      }
      setUserName(data.userName);
      setBudgetCategories(data.budgetCategories);
      setIncomeCategories(data.incomeCategories);
      setIncomeEntries(data.incomeEntries);
      setExpenseEntries(data.expenseEntries);
      setGoals(data.goals);
      setBudgets(data.budgets);
      setTransactions(data.transactions);
      setMonthlyTrendData(data.monthlyTrendData ?? []);

      if (typeof data.initialSavingsCents === "number") {
        // TODO: wire this into UI if initial savings is displayed later.
      }
    },
    [
      onboardingVersion,
      setBudgetCategories,
      setBudgets,
      setCurrencyState,
      setExpenseEntries,
      setGoals,
      setIncomeEntries,
      setIncomeCategories,
      setIsOnboardingComplete,
      setMonthlyTrendData,
      setTransactions,
      setUserName,
    ],
  );

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
        console.error(
          "Failed to load data from DB, falling back to local storage:",
          e,
        );
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
  }, [loadFromDb, loadFromLocal, setIsAppLoading, userId]);

  return { useLocalFallback, setUseLocalFallback };
};
