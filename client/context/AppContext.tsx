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
  AUTOBUDGET_CATEGORY_COLORS,
  CATEGORY_COLORS,
  GERMAN_MONTHS_SHORT,
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
  BudgetExpense,
  CurrencyCode,
  ExpenseEntry,
  Goal,
  GoalDeposit,
  IncomeEntry,
  PersistedData,
  Transaction,
} from "@/context/app/types";
import {
  loadPersistedData,
  savePersistedData,
  clearPersistedData,
} from "@/services/local-storage";
import {
  createBudget as createBudgetInDb,
  createExpenseEntry,
  createGoal as createGoalInDb,
  createGoalContribution,
  createIncomeEntry,
  createTransaction,
  deleteBudget as deleteBudgetInDb,
  deleteExpenseEntry as deleteExpenseEntryInDb,
  deleteGoal as deleteGoalInDb,
  deleteGoalContribution,
  deleteIncomeEntry as deleteIncomeEntryInDb,
  deleteTransaction as deleteTransactionInDb,
  deleteTransactionsByBudget,
  fetchAppData,
  replaceExpenseEntries,
  replaceIncomeEntries,
  resetUserData,
  updateBudget as updateBudgetInDb,
  updateExpenseEntry as updateExpenseEntryInDb,
  updateGoal as updateGoalInDb,
  updateGoalContribution,
  updateIncomeEntry as updateIncomeEntryInDb,
  updateOnboardingComplete,
  updateTransaction as updateTransactionInDb,
  upsertUserCurrency,
} from "@/services/app-service";
import type { BudgetCategoryRow } from "@/services/types";
import { formatDate, formatWeekLabel, parseFormattedDate } from "@/utils/dates";
import { generateId } from "@/utils/ids";
import { toCents } from "@/utils/money";
import { calculateWeeklySpending } from "@/utils/weekly-spending";

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
  const [useLocalFallback, setUseLocalFallback] = useState(false);

  const { user } = useAuth();
  const userId = user?.id ?? null;
  const canUseDb = Boolean(userId) && !useLocalFallback;

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
      if (data.lastBudgetResetMonth !== undefined) {
        setLastBudgetResetMonth(data.lastBudgetResetMonth);
      }
    } catch (e) {
      console.error("Failed to load data from storage:", e);
    }
  }, []);

  const loadFromDb = useCallback(async (id: string) => {
    const data = await fetchAppData(id, ONBOARDING_VERSION);
    setIsOnboardingComplete(data.isOnboardingComplete);
    if (data.currency) {
      setCurrencyState(data.currency);
    }
    setUserName(data.userName);
    setBudgetCategories(data.budgetCategories);
    setIncomeEntries(data.incomeEntries);
    setExpenseEntries(data.expenseEntries);
    setGoals(data.goals);
    setBudgets(data.budgets);
    setTransactions(data.transactions);

    if (typeof data.initialSavingsCents === "number") {
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
      await savePersistedData(data);
    } catch (e) {
      console.error("Failed to save data to storage:", e);
    }
  }, [
    isAppLoading,
    useLocalFallback,
    isOnboardingComplete,
    currency,
    incomeEntries,
    expenseEntries,
    goals,
    budgets,
    transactions,
    lastBudgetResetMonth,
  ]);

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
      categories[categoryName] =
        (categories[categoryName] || 0) + budget.current;
    });

    const fixedCategories: Record<string, string[]> = {
      Wohnen: ["Wohnen", "Miete"],
      Abonnements: ["Netflix", "Spotify", "Handy", "Disney+", "Amazon Prime"],
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
        const variableBase =
          totalVariableExpenses * variationFactors[i % variationFactors.length];
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
      try {
        await upsertUserCurrency(userId, nextCurrency);
      } catch (error) {
        handleDbError(error, "setCurrency");
      }
    })();
  };

  const addIncomeEntry = (type: string, amount: number) => {
    const tempId = generateId();
    setIncomeEntries((prev) => [...prev, { id: tempId, type, amount }]);

    if (!canUseDb || !userId) return;
    void (async () => {
      try {
        const createdEntry = await createIncomeEntry(
          userId,
          type,
          amount,
          currency,
        );
        setIncomeEntries((prev) =>
          prev.map((entry) => (entry.id === tempId ? createdEntry : entry)),
        );
      } catch (error) {
        handleDbError(error, "addIncomeEntry");
      }
    })();
  };

  const addExpenseEntry = (type: string, amount: number) => {
    const tempId = generateId();
    setExpenseEntries((prev) => [...prev, { id: tempId, type, amount }]);

    if (!canUseDb || !userId) return;
    void (async () => {
      try {
        const createdEntry = await createExpenseEntry(
          userId,
          type,
          amount,
          currency,
        );
        setExpenseEntries((prev) =>
          prev.map((entry) => (entry.id === tempId ? createdEntry : entry)),
        );
      } catch (error) {
        handleDbError(error, "addExpenseEntry");
      }
    })();
  };

  const setIncomeEntriesFromOnboarding = (
    entries: { type: string; amount: number }[],
  ) => {
    const localEntries: IncomeEntry[] = entries.map((entry) => ({
      id: generateId(),
      type: entry.type,
      amount: entry.amount,
    }));
    setIncomeEntries(localEntries);

    if (!canUseDb || !userId) return;
    void (async () => {
      try {
        const savedEntries = await replaceIncomeEntries(
          userId,
          entries,
          currency,
        );
        setIncomeEntries(savedEntries);
      } catch (error) {
        handleDbError(error, "setIncomeEntriesFromOnboarding");
      }
    })();
  };

  const setExpenseEntriesFromOnboarding = (
    entries: { type: string; amount: number }[],
  ) => {
    const localEntries: ExpenseEntry[] = entries.map((entry) => ({
      id: generateId(),
      type: entry.type,
      amount: entry.amount,
    }));
    setExpenseEntries(localEntries);

    if (!canUseDb || !userId) return;
    void (async () => {
      try {
        const savedEntries = await replaceExpenseEntries(
          userId,
          entries,
          currency,
        );
        setExpenseEntries(savedEntries);
      } catch (error) {
        handleDbError(error, "setExpenseEntriesFromOnboarding");
      }
    })();
  };

  const addGoalDeposit = (
    goalId: string,
    amount: number,
    customDate?: Date,
  ) => {
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
      }),
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
      try {
        const transactionId = await createTransaction({
          user_id: userId,
          type: "expense",
          amount_cents: toCents(amount),
          currency,
          name: goal.name,
          category_name: "Sparziel",
          transaction_at: depositDate.toISOString(),
          source: "manual",
        });

        const contributionId = await createGoalContribution({
          user_id: userId,
          goal_id: goalId,
          amount_cents: toCents(amount),
          currency,
          contribution_type: isRepayment ? "repayment" : "deposit",
          contribution_at: depositDate.toISOString(),
          transaction_id: transactionId,
        });

        setGoals((prev) =>
          prev.map((g) => {
            if (g.id !== goalId) return g;
            return {
              ...g,
              deposits: g.deposits.map((deposit) =>
                deposit.id === tempDepositId
                  ? { ...deposit, id: contributionId }
                  : deposit,
              ),
            };
          }),
        );

        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === tempTransactionId ? { ...tx, id: transactionId } : tx,
          ),
        );
      } catch (error) {
        handleDbError(error, "addGoalDeposit");
      }
    })();
  };

  const updateGoalDeposit = (
    goalId: string,
    depositId: string,
    amount: number,
    date?: Date,
  ) => {
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
      }),
    );

    if (!canUseDb) return;
    const existingGoal = goals.find((goal) => goal.id === goalId);
    const existingDeposit = existingGoal?.deposits.find(
      (deposit) => deposit.id === depositId,
    );
    const fallbackDate = existingDeposit
      ? parseFormattedDate(existingDeposit.date)
      : new Date();
    const contributionAt = date || fallbackDate;
    void (async () => {
      try {
        await updateGoalContribution(depositId, {
          amount_cents: toCents(amount),
          contribution_at: contributionAt.toISOString(),
        });
      } catch (error) {
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
      }),
    );

    if (!canUseDb) return;
    void (async () => {
      try {
        await deleteGoalContribution(depositId);
      } catch (error) {
        handleDbError(error, "deleteGoalDeposit");
      }
    })();
  };

  const addBudgetExpense = (
    budgetId: string,
    amount: number,
    name: string,
    customDate?: Date,
  ) => {
    const expenseDate = customDate || new Date();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const expenseMonth = expenseDate.getMonth();
    const expenseYear = expenseDate.getFullYear();
    const isCurrentMonth =
      expenseMonth === currentMonth && expenseYear === currentYear;

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
      }),
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
        handleDbError(
          new Error(`Missing budget category for ${budget.name}`),
          "addBudgetExpense",
        );
        return;
      }

      let transactionId: string;
      try {
        transactionId = await createTransaction({
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
        });
      } catch (error) {
        handleDbError(error, "addBudgetExpense");
        return;
      }

      setBudgets((prev) =>
        prev.map((b) => {
          if (b.id !== budgetId) return b;
          return {
            ...b,
            expenses: b.expenses.map((expense) =>
              expense.id === tempExpenseId
                ? { ...expense, id: transactionId }
                : expense,
            ),
          };
        }),
      );

      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === tempExpenseId ? { ...tx, id: transactionId } : tx,
        ),
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
      const category = isExpense
        ? resolveBudgetCategory(transaction.category)
        : null;
      try {
        const transactionId = await createTransaction({
          user_id: userId,
          type: isExpense ? "expense" : "income",
          amount_cents: toCents(Math.abs(transaction.amount)),
          currency,
          name: transaction.name,
          category_name: transaction.category,
          budget_category_id: category?.id ?? null,
          transaction_at: transactionAt.toISOString(),
          source: "manual",
        });
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === tempId ? { ...tx, id: transactionId } : tx,
          ),
        );
      } catch (error) {
        handleDbError(error, "addTransaction");
      }
    })();
  };

  const completeOnboarding = () => {
    setIsOnboardingComplete(true);
    if (!canUseDb || !userId) return;
    void (async () => {
      try {
        await updateOnboardingComplete(userId, ONBOARDING_VERSION);
      } catch (error) {
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
      }),
    );

    if (!canUseDb) return;
    void (async () => {
      try {
        await updateGoalInDb(goalId, updates);
      } catch (error) {
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
      }),
    );

    if (!canUseDb) return;
    void (async () => {
      try {
        await updateBudgetInDb(budgetId, updates);
      } catch (error) {
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
      try {
        const newGoalId = await createGoalInDb(
          userId,
          name,
          icon,
          target,
          !isOnboardingComplete,
        );
        setGoals((prev) =>
          prev.map((goal) =>
            goal.id === tempId ? { ...goal, id: newGoalId } : goal,
          ),
        );
      } catch (error) {
        handleDbError(error, "addGoal");
      }
    })();
  };

  const addBudget = (
    name: string,
    icon: string,
    iconColor: string,
    limit: number,
  ) => {
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
        handleDbError(
          new Error(`Missing budget category for ${name}`),
          "addBudget",
        );
        return;
      }
      try {
        const newBudgetId = await createBudgetInDb({
          user_id: userId,
          category_id: category.id,
          name,
          limit_amount_cents: toCents(limit),
          period: "monthly",
          currency,
          is_active: true,
        });
        setBudgets((prev) =>
          prev.map((budget) =>
            budget.id === tempId ? { ...budget, id: newBudgetId } : budget,
          ),
        );
      } catch (error) {
        handleDbError(error, "addBudget");
      }
    })();
  };

  const addExpenseWithAutobudget = (
    categoryName: string,
    icon: string,
    amount: number,
    name: string,
    date: Date,
  ) => {
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
      (b) => b.name.toLowerCase() === categoryName.toLowerCase(),
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

      const iconColor = AUTOBUDGET_CATEGORY_COLORS[categoryName] || "#7340fd";
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
        try {
          const newBudgetId = await createBudgetInDb({
            user_id: userId,
            category_id: dbCategory?.id,
            name: categoryName,
            limit_amount_cents: 0,
            period: "monthly",
            currency,
            is_active: true,
          });
          budgetId = newBudgetId;
          setBudgets((prev) =>
            prev.map((budget) =>
              budget.id === tempBudgetId
                ? { ...budget, id: newBudgetId }
                : budget,
            ),
          );
        } catch (error) {
          handleDbError(error, "addExpenseWithAutobudget");
          return;
        }
      }

      let transactionId: string;
      try {
        transactionId = await createTransaction({
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
        });
      } catch (error) {
        handleDbError(error, "addExpenseWithAutobudget");
        return;
      }

      setBudgets((prev) =>
        prev.map((budget) => {
          if (budget.id !== (budgetId ?? tempBudgetId)) return budget;
          return {
            ...budget,
            expenses: budget.expenses.map((expense) =>
              expense.id === tempExpenseId
                ? { ...expense, id: transactionId }
                : expense,
            ),
          };
        }),
      );

      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === tempExpenseId ? { ...tx, id: transactionId } : tx,
        ),
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
      }),
    );

    if (!canUseDb) return;
    void (async () => {
      try {
        await updateIncomeEntryInDb(id, type, amount);
      } catch (error) {
        handleDbError(error, "updateIncomeEntry");
      }
    })();
  };

  const deleteIncomeEntry = (id: string) => {
    setIncomeEntries((prev) => prev.filter((entry) => entry.id !== id));

    if (!canUseDb) return;
    void (async () => {
      try {
        await deleteIncomeEntryInDb(id);
      } catch (error) {
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
      }),
    );

    if (!canUseDb) return;
    void (async () => {
      try {
        await updateExpenseEntryInDb(id, type, amount);
      } catch (error) {
        handleDbError(error, "updateExpenseEntry");
      }
    })();
  };

  const deleteExpenseEntry = (id: string) => {
    setExpenseEntries((prev) => prev.filter((entry) => entry.id !== id));

    if (!canUseDb) return;
    void (async () => {
      try {
        await deleteExpenseEntryInDb(id);
      } catch (error) {
        handleDbError(error, "deleteExpenseEntry");
      }
    })();
  };

  const updateBudgetExpense = (
    budgetId: string,
    expenseId: string,
    amount: number,
    name: string,
    date?: Date,
  ) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    setBudgets((prev) =>
      prev.map((budget) => {
        if (budget.id === budgetId) {
          const oldExpense = budget.expenses.find((e) => e.id === expenseId);
          if (!oldExpense) return budget;

          const oldTimestamp =
            oldExpense.timestamp ||
            parseFormattedDate(oldExpense.date).getTime();
          const oldDate = new Date(oldTimestamp);
          const wasInCurrentMonth =
            oldDate.getMonth() === currentMonth &&
            oldDate.getFullYear() === currentYear;

          const newDate = date || new Date(oldTimestamp);
          const isInCurrentMonth =
            newDate.getMonth() === currentMonth &&
            newDate.getFullYear() === currentYear;

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
      }),
    );

    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === expenseId) {
          return {
            ...tx,
            amount: -amount,
            name,
            date: date ? formatDate(date) : tx.date,
          };
        }
        return tx;
      }),
    );

    if (!canUseDb) return;
    const existingBudget = budgets.find((b) => b.id === budgetId);
    const existingExpense = existingBudget?.expenses.find(
      (e) => e.id === expenseId,
    );
    const fallbackTimestamp =
      existingExpense?.timestamp ??
      (existingExpense
        ? parseFormattedDate(existingExpense.date).getTime()
        : Date.now());
    const transactionDate = date || new Date(fallbackTimestamp);
    void (async () => {
      try {
        await updateTransactionInDb(expenseId, {
          amount_cents: toCents(amount),
          name,
          transaction_at: transactionDate.toISOString(),
        });
      } catch (error) {
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

          const expenseTimestamp =
            expenseToDelete.timestamp ||
            parseFormattedDate(expenseToDelete.date).getTime();
          const expenseDate = new Date(expenseTimestamp);
          const isCurrentMonth =
            expenseDate.getMonth() === currentMonth &&
            expenseDate.getFullYear() === currentYear;

          return {
            ...b,
            current: isCurrentMonth
              ? Math.max(0, b.current - expenseToDelete.amount)
              : b.current,
            expenses: b.expenses.filter((e) => e.id !== expenseId),
          };
        }
        return b;
      }),
    );

    setTransactions((prev) => prev.filter((tx) => tx.id !== expenseId));

    if (!canUseDb) return;
    void (async () => {
      try {
        await deleteTransactionInDb(expenseId);
      } catch (error) {
        handleDbError(error, "deleteBudgetExpense");
      }
    })();
  };

  const updateTransaction = (
    transactionId: string,
    updates: Partial<Omit<Transaction, "id">>,
  ) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === transactionId) {
          return { ...tx, ...updates };
        }
        return tx;
      }),
    );

    if (!canUseDb) return;
    void (async () => {
      const payload: {
        amount_cents?: number;
        category_name?: string | null;
        name?: string;
        transaction_at?: string;
        type?: "income" | "expense";
      } = {};
      if (typeof updates.name === "string") payload.name = updates.name;
      if (typeof updates.category === "string")
        payload.category_name = updates.category;
      if (typeof updates.amount === "number") {
        payload.amount_cents = toCents(Math.abs(updates.amount));
        payload.type = updates.amount < 0 ? "expense" : "income";
      }
      if (typeof updates.date === "string") {
        const transactionDate = parseFormattedDate(updates.date);
        payload.transaction_at = transactionDate.toISOString();
      }
      if (Object.keys(payload).length === 0) return;
      try {
        await updateTransactionInDb(transactionId, payload);
      } catch (error) {
        handleDbError(error, "updateTransaction");
      }
    })();
  };

  const deleteTransaction = (transactionId: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== transactionId));

    if (!canUseDb) return;
    void (async () => {
      try {
        await deleteTransactionInDb(transactionId);
      } catch (error) {
        handleDbError(error, "deleteTransaction");
      }
    })();
  };

  const deleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));

    if (!canUseDb) return;
    void (async () => {
      try {
        await deleteGoalInDb(goalId);
      } catch (error) {
        handleDbError(error, "deleteGoal");
      }
    })();
  };

  const deleteBudget = (budgetId: string) => {
    const budget = budgets.find((b) => b.id === budgetId);
    if (budget) {
      setTransactions((prev) =>
        prev.filter((tx) => tx.category !== budget.name),
      );
    }
    setBudgets((prev) => prev.filter((b) => b.id !== budgetId));

    if (!canUseDb) return;
    void (async () => {
      try {
        await deleteTransactionsByBudget(budgetId);
        await deleteBudgetInDb(budgetId);
      } catch (error) {
        handleDbError(error, "deleteBudget");
      }
    })();
  };

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

  const resetAllData = async () => {
    try {
      if (canUseDb && userId) {
        await resetUserData(userId);
      }
      await clearPersistedData();
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
