import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";

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
}

export interface InsightCategory {
  name: string;
  amount: number;
  color: string;
}

export interface AppState {
  isOnboardingComplete: boolean;
  userName: string;
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  goals: Goal[];
  budgets: Budget[];
  weeklySpending: WeeklySpending[];
  transactions: Transaction[];
  insightCategories: InsightCategory[];
  totalIncome: number;
  totalFixedExpenses: number;
  monthlyBudget: number;
  balance: number;
}

export interface AppContextType extends AppState {
  addIncomeEntry: (type: string, amount: number) => void;
  addExpenseEntry: (type: string, amount: number) => void;
  setIncomeEntries: (entries: Array<{type: string, amount: number}>) => void;
  setExpenseEntries: (entries: Array<{type: string, amount: number}>) => void;
  addGoalDeposit: (goalId: string, amount: number) => void;
  addBudgetExpense: (budgetId: string, amount: number, name: string) => void;
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  completeOnboarding: () => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  updateBudget: (budgetId: string, updates: Partial<Budget>) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

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

const INITIAL_INCOME_ENTRIES: IncomeEntry[] = [
  { id: "income-1", type: "Gehalt/Lohn", amount: 3200 },
  { id: "income-2", type: "Nebenjob", amount: 612.57 },
];

const INITIAL_EXPENSE_ENTRIES: ExpenseEntry[] = [
  { id: "expense-1", type: "Wohnen", amount: 850 },
  { id: "expense-2", type: "Netflix", amount: 12.99 },
  { id: "expense-3", type: "Spotify", amount: 9.99 },
  { id: "expense-4", type: "Handy", amount: 29.99 },
];

const INITIAL_GOALS: Goal[] = [
  {
    id: "goal-1",
    name: "Vespa 2026",
    icon: "🛵",
    target: 5200,
    current: 924.73,
    remaining: 4275.27,
    deposits: [
      { id: "dep-1", date: "Heute, 11:32", amount: 50.00, type: "Einzahlung" },
      { id: "dep-2", date: "Gestern", amount: 100.00, type: "Einzahlung" },
      { id: "dep-3", date: "12/11/2025", amount: 150.00, type: "Einzahlung" },
      { id: "dep-4", date: "05/11/2025", amount: 200.00, type: "Einzahlung" },
      { id: "dep-5", date: "28/10/2025", amount: 424.73, type: "Einzahlung" },
    ],
  },
  {
    id: "goal-2",
    name: "Klarna abbezahlen",
    icon: "💳",
    target: 443.12,
    current: 260.67,
    remaining: 182.45,
    deposits: [
      { id: "rep-1", date: "Heute, 09:15", amount: 30.00, type: "Rückzahlung" },
      { id: "rep-2", date: "Gestern", amount: 50.00, type: "Rückzahlung" },
      { id: "rep-3", date: "10/11/2025", amount: 80.67, type: "Rückzahlung" },
      { id: "rep-4", date: "25/10/2025", amount: 100.00, type: "Rückzahlung" },
    ],
  },
];

const INITIAL_BUDGETS: Budget[] = [
  {
    id: "budget-1",
    name: "Lebensmittel",
    icon: "shopping-cart",
    iconColor: "#F59E0B",
    limit: 400,
    current: 92.40,
    expenses: [
      { id: "be-1", name: "REWE", date: "Heute, 14:30", amount: 45.20 },
      { id: "be-2", name: "Lidl", date: "Gestern", amount: 32.80 },
      { id: "be-3", name: "Bäckerei Schmidt", date: "14/11/2025", amount: 14.40 },
    ],
  },
  {
    id: "budget-2",
    name: "Shopping",
    icon: "shopping-bag",
    iconColor: "#8B5CF6",
    limit: 200,
    current: 40.37,
    expenses: [
      { id: "be-4", name: "Zara", date: "12/11/2025", amount: 29.99 },
      { id: "be-5", name: "Amazon", date: "10/11/2025", amount: 10.38 },
    ],
  },
];

const INITIAL_WEEKLY_SPENDING: WeeklySpending[] = [
  { day: "Mon", amount: 45, maxAmount: 120 },
  { day: "Tue", amount: 85, maxAmount: 120 },
  { day: "Wed", amount: 65, maxAmount: 120 },
  { day: "Thu", amount: 50, maxAmount: 120 },
  { day: "Fri", amount: 95, maxAmount: 120 },
  { day: "Sat", amount: 120, maxAmount: 120 },
  { day: "Sun", amount: 75, maxAmount: 120 },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: "tx-1", name: "Starbucks", category: "Lebensmittel", date: "Heute, 11:32", amount: -4.50, icon: "coffee" },
  { id: "tx-2", name: "Amazon", category: "Shopping", date: "28.11. 20:14", amount: -29.90, icon: "shopping-cart" },
  { id: "tx-3", name: "REWE", category: "Lebensmittel", date: "27.11. 16:45", amount: -67.32, icon: "shopping-cart" },
  { id: "tx-4", name: "Netflix", category: "Abonnements", date: "25.11. 00:00", amount: -12.99, icon: "tv" },
  { id: "tx-5", name: "Spotify", category: "Abonnements", date: "24.11. 00:00", amount: -9.99, icon: "music" },
  { id: "tx-6", name: "Gehalt", category: "Einkommen", date: "01.11. 00:00", amount: 3200.00, icon: "briefcase" },
];

const INITIAL_INSIGHT_CATEGORIES: InsightCategory[] = [
  { name: "Lebensmittel", amount: 410.12, color: "#3B5BDB" },
  { name: "Hygiene", amount: 160.48, color: "#B8C4E9" },
  { name: "Wohnen", amount: 600.23, color: "#C77DFF" },
  { name: "Abonnements", amount: 160.48, color: "#7B8CDE" },
  { name: "Shopping", amount: 160.48, color: "#9D4EDD" },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(true);
  const [userName] = useState("Deni");
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(INITIAL_INCOME_ENTRIES);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>(INITIAL_EXPENSE_ENTRIES);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [weeklySpending, setWeeklySpending] = useState<WeeklySpending[]>(INITIAL_WEEKLY_SPENDING);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [insightCategories] = useState<InsightCategory[]>(INITIAL_INSIGHT_CATEGORIES);

  const totalIncome = useMemo(() => {
    return incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }, [incomeEntries]);

  const totalFixedExpenses = useMemo(() => {
    return expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }, [expenseEntries]);

  const monthlyBudget = useMemo(() => {
    return totalIncome - totalFixedExpenses;
  }, [totalIncome, totalFixedExpenses]);

  const variableSpending = useMemo(() => {
    return budgets.reduce((sum, budget) => sum + budget.current, 0);
  }, [budgets]);

  const balance = useMemo(() => {
    return monthlyBudget - variableSpending;
  }, [monthlyBudget, variableSpending]);

  const addIncomeEntry = (type: string, amount: number) => {
    const newEntry: IncomeEntry = {
      id: generateId(),
      type,
      amount,
    };
    setIncomeEntries((prev) => [...prev, newEntry]);
  };

  const addExpenseEntry = (type: string, amount: number) => {
    const newEntry: ExpenseEntry = {
      id: generateId(),
      type,
      amount,
    };
    setExpenseEntries((prev) => [...prev, newEntry]);
  };

  const setIncomeEntriesFromOnboarding = (entries: Array<{type: string, amount: number}>) => {
    const newEntries: IncomeEntry[] = entries.map((entry) => ({
      id: generateId(),
      type: entry.type,
      amount: entry.amount,
    }));
    setIncomeEntries(newEntries);
  };

  const setExpenseEntriesFromOnboarding = (entries: Array<{type: string, amount: number}>) => {
    const newEntries: ExpenseEntry[] = entries.map((entry) => ({
      id: generateId(),
      type: entry.type,
      amount: entry.amount,
    }));
    setExpenseEntries(newEntries);
  };

  const addGoalDeposit = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === goalId) {
          const newDeposit: GoalDeposit = {
            id: generateId(),
            date: formatDate(new Date()),
            amount,
            type: goal.name.toLowerCase().includes("klarna") ? "Rückzahlung" : "Einzahlung",
          };
          const newCurrent = goal.current + amount;
          const newRemaining = Math.max(0, goal.target - newCurrent);
          return {
            ...goal,
            current: newCurrent,
            remaining: newRemaining,
            deposits: [newDeposit, ...goal.deposits],
          };
        }
        return goal;
      })
    );

    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      const newTransaction: Transaction = {
        id: generateId(),
        name: goal.name,
        category: "Sparziel",
        date: formatDate(new Date()),
        amount: -amount,
        icon: "target",
      };
      setTransactions((prev) => [newTransaction, ...prev]);
    }
  };

  const addBudgetExpense = (budgetId: string, amount: number, name: string) => {
    setBudgets((prev) =>
      prev.map((budget) => {
        if (budget.id === budgetId) {
          const newExpense: BudgetExpense = {
            id: generateId(),
            name,
            date: formatDate(new Date()),
            amount,
          };
          return {
            ...budget,
            current: budget.current + amount,
            expenses: [newExpense, ...budget.expenses],
          };
        }
        return budget;
      })
    );

    const budget = budgets.find((b) => b.id === budgetId);
    if (budget) {
      const newTransaction: Transaction = {
        id: generateId(),
        name,
        category: budget.name,
        date: formatDate(new Date()),
        amount: -amount,
        icon: budget.icon,
      };
      setTransactions((prev) => [newTransaction, ...prev]);
    }

    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    setWeeklySpending((prev) =>
      prev.map((day, index) => {
        if (index === dayIndex) {
          return {
            ...day,
            amount: day.amount + amount,
            maxAmount: Math.max(day.maxAmount, day.amount + amount),
          };
        }
        return day;
      })
    );
  };

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
    };
    setTransactions((prev) => [newTransaction, ...prev]);
  };

  const completeOnboarding = () => {
    setIsOnboardingComplete(true);
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
  };

  const value: AppContextType = {
    isOnboardingComplete,
    userName,
    incomeEntries,
    expenseEntries,
    goals,
    budgets,
    weeklySpending,
    transactions,
    insightCategories,
    totalIncome,
    totalFixedExpenses,
    monthlyBudget,
    balance,
    addIncomeEntry,
    addExpenseEntry,
    setIncomeEntries: setIncomeEntriesFromOnboarding,
    setExpenseEntries: setExpenseEntriesFromOnboarding,
    addGoalDeposit,
    addBudgetExpense,
    addTransaction,
    completeOnboarding,
    updateGoal,
    updateBudget,
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
