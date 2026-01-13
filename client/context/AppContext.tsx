import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@luke_app_data";

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

export interface MonthlyTrendData {
  month: string;
  monthIndex: number;
  amount: number;
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
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  goals: Goal[];
  budgets: Budget[];
  transactions: Transaction[];
  lastBudgetResetMonth: number;
}

export function AppProvider({ children }: AppProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [userName] = useState("Deni");
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(INITIAL_INCOME_ENTRIES);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>(INITIAL_EXPENSE_ENTRIES);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [lastBudgetResetMonth, setLastBudgetResetMonth] = useState(() => new Date().getMonth());

  useEffect(() => {
    const loadData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue !== null) {
          const data: PersistedData = JSON.parse(jsonValue);
          setIsOnboardingComplete(data.isOnboardingComplete ?? false);
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
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const saveData = useCallback(async () => {
    if (isLoading) return;
    try {
      const data: PersistedData = {
        isOnboardingComplete,
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
  }, [isLoading, isOnboardingComplete, incomeEntries, expenseEntries, goals, budgets, transactions, lastBudgetResetMonth]);

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

  const addGoalDeposit = (goalId: string, amount: number, customDate?: Date) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === goalId) {
          const depositDate = customDate || new Date();
          const newDeposit: GoalDeposit = {
            id: generateId(),
            date: formatDate(depositDate),
            amount,
            type: goal.name.toLowerCase().includes("klarna") ? "Rückzahlung" : "Einzahlung",
          };
          const newCurrent = goal.current + amount;
          const newRemaining = Math.max(0, goal.target - newCurrent);
          const updatedDeposits = [newDeposit, ...goal.deposits].sort((a, b) => {
            const dateA = parseFormattedDate(a.date);
            const dateB = parseFormattedDate(b.date);
            return dateB.getTime() - dateA.getTime();
          });
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

  const updateGoalDeposit = (goalId: string, depositId: string, amount: number, date?: Date) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === goalId) {
          const oldDeposit = goal.deposits.find((d) => d.id === depositId);
          if (!oldDeposit) return goal;
          
          const amountDiff = amount - oldDeposit.amount;
          const updatedDeposits = goal.deposits.map((d) => {
            if (d.id === depositId) {
              return {
                ...d,
                amount,
                date: date ? formatDate(date) : d.date,
              };
            }
            return d;
          }).sort((a, b) => {
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
  };

  const addBudgetExpense = (budgetId: string, amount: number, name: string, customDate?: Date) => {
    const expenseDate = customDate || new Date();
    
    const budget = budgets.find((b) => b.id === budgetId);
    if (!budget) return;
    
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.id === budgetId) {
          const newExpense: BudgetExpense = {
            id: generateId(),
            name,
            date: formatDate(expenseDate),
            amount,
          };
          return {
            ...b,
            current: b.current + amount,
            expenses: [newExpense, ...b.expenses],
          };
        }
        return b;
      })
    );

    const newTransaction: Transaction = {
      id: generateId(),
      name,
      category: budget.name,
      date: formatDate(expenseDate),
      amount: -amount,
      icon: budget.icon,
    };
    setTransactions((prev) => [newTransaction, ...prev]);
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

  const addGoal = (name: string, icon: string, target: number) => {
    const newGoal: Goal = {
      id: generateId(),
      name,
      icon,
      target,
      current: 0,
      remaining: target,
      deposits: [],
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  const addBudget = (name: string, icon: string, iconColor: string, limit: number) => {
    const newBudget: Budget = {
      id: generateId(),
      name,
      icon,
      iconColor,
      limit,
      current: 0,
      expenses: [],
    };
    setBudgets((prev) => [...prev, newBudget]);
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

    setBudgets((prevBudgets) => {
      const existingBudget = prevBudgets.find(
        (b) => b.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (existingBudget) {
        const newExpense: BudgetExpense = {
          id: generateId(),
          name,
          date: formatDate(date),
          amount,
        };
        const updatedBudgets = prevBudgets.map((b) => {
          if (b.id === existingBudget.id) {
            return {
              ...b,
              current: b.current + amount,
              expenses: [newExpense, ...b.expenses],
            };
          }
          return b;
        });

        const newTransaction: Transaction = {
          id: generateId(),
          name,
          category: categoryName,
          date: formatDate(date),
          amount: -amount,
          icon,
        };
        setTransactions((prev) => [newTransaction, ...prev]);

        return updatedBudgets;
      } else {
        const iconColor = categoryColors[categoryName] || "#7340fd";
        const newExpense: BudgetExpense = {
          id: generateId(),
          name,
          date: formatDate(date),
          amount,
        };
        const newBudget: Budget = {
          id: generateId(),
          name: categoryName,
          icon,
          iconColor,
          limit: 0,
          current: amount,
          expenses: [newExpense],
        };

        const newTransaction: Transaction = {
          id: generateId(),
          name,
          category: categoryName,
          date: formatDate(date),
          amount: -amount,
          icon,
        };
        setTransactions((prev) => [newTransaction, ...prev]);

        return [...prevBudgets, newBudget];
      }
    });
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
  };

  const deleteIncomeEntry = (id: string) => {
    setIncomeEntries((prev) => prev.filter((entry) => entry.id !== id));
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
  };

  const deleteExpenseEntry = (id: string) => {
    setExpenseEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const updateBudgetExpense = (budgetId: string, expenseId: string, amount: number, name: string, date?: Date) => {
    setBudgets((prev) =>
      prev.map((budget) => {
        if (budget.id === budgetId) {
          const oldExpense = budget.expenses.find((e) => e.id === expenseId);
          if (!oldExpense) return budget;
          
          const amountDiff = amount - oldExpense.amount;
          const updatedExpenses = budget.expenses.map((e) => {
            if (e.id === expenseId) {
              return {
                ...e,
                amount,
                name,
                date: date ? formatDate(date) : e.date,
              };
            }
            return e;
          });
          
          return {
            ...budget,
            current: budget.current + amountDiff,
            expenses: updatedExpenses,
          };
        }
        return budget;
      })
    );
    
    const budget = budgets.find((b) => b.id === budgetId);
    const expense = budget?.expenses.find((e) => e.id === expenseId);
    if (expense) {
      const txId = transactions.find(
        (tx) => tx.category === budget?.name && Math.abs(tx.amount) === expense.amount && tx.name === expense.name
      )?.id;
      if (txId) {
        setTransactions((prev) =>
          prev.map((tx) => {
            if (tx.id === txId) {
              return { ...tx, amount: -amount, name, date: date ? formatDate(date) : tx.date };
            }
            return tx;
          })
        );
      }
    }
  };

  const deleteBudgetExpense = (budgetId: string, expenseId: string) => {
    const budget = budgets.find((b) => b.id === budgetId);
    const expense = budget?.expenses.find((e) => e.id === expenseId);
    
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.id === budgetId) {
          const expenseToDelete = b.expenses.find((e) => e.id === expenseId);
          if (!expenseToDelete) return b;
          
          return {
            ...b,
            current: Math.max(0, b.current - expenseToDelete.amount),
            expenses: b.expenses.filter((e) => e.id !== expenseId),
          };
        }
        return b;
      })
    );
    
    if (expense && budget) {
      setTransactions((prev) =>
        prev.filter(
          (tx) => !(tx.category === budget.name && tx.name === expense.name && Math.abs(tx.amount) === expense.amount)
        )
      );
    }
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
  };

  const deleteTransaction = (transactionId: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== transactionId));
  };

  const deleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
  };

  const deleteBudget = (budgetId: string) => {
    const budget = budgets.find((b) => b.id === budgetId);
    if (budget) {
      setTransactions((prev) => prev.filter((tx) => tx.category !== budget.name));
    }
    setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
  };

  const resetMonthlyBudgets = () => {
    const currentMonth = new Date().getMonth();
    if (currentMonth !== lastBudgetResetMonth) {
      setBudgets((prev) =>
        prev.map((budget) => ({
          ...budget,
          current: 0,
          expenses: [],
        }))
      );
      setLastBudgetResetMonth(currentMonth);
    }
  };

  React.useEffect(() => {
    const currentMonth = new Date().getMonth();
    const currentDay = new Date().getDate();
    if (currentDay === 1 && currentMonth !== lastBudgetResetMonth) {
      resetMonthlyBudgets();
    }
  }, [lastBudgetResetMonth]);

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

  if (isLoading) {
    return null;
  }

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
