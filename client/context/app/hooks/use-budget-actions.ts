import { useCallback } from "react";
import type {
  Budget,
  BudgetExpense,
  CurrencyCode,
  Transaction,
} from "@/context/app/types";
import { AUTOBUDGET_CATEGORY_COLORS } from "@/context/app/constants";
import {
  createBudget as createBudgetInDb,
  createTransaction,
  deleteBudget as deleteBudgetInDb,
  deleteTransactionsByBudget,
  updateBudget as updateBudgetInDb,
  updateTransaction as updateTransactionInDb,
  deleteTransaction as deleteTransactionInDb,
} from "@/services/app-service";
import { formatDate, parseFormattedDate } from "@/utils/dates";
import { generateId } from "@/utils/ids";
import { toCents } from "@/utils/money";
import type { AddTransactionInputT } from "@/context/app/hooks/use-transaction-actions";

export type BudgetCategoryLiteT = { id: string } | null;

type BudgetActionsDepsT = {
  userId: string | null;
  canUseDb: boolean;
  currency: CurrencyCode;
  budgets: Budget[];
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  resolveBudgetCategory: (name: string) => BudgetCategoryLiteT;
  handleDbError: (error: unknown, context: string) => void;
  handleSnapXp: (transactionId: string) => Promise<unknown>;
  addTransaction: (transaction: AddTransactionInputT) => void;
};

/**
 * Creates actions for budgets and budget expenses.
 */
export const useBudgetActions = ({
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
}: BudgetActionsDepsT) => {
  const addBudgetExpense = useCallback(
    (budgetId: string, amount: number, name: string, customDate?: Date) => {
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

        await handleSnapXp(transactionId);
      })();
    },
    [
      budgets,
      canUseDb,
      currency,
      handleDbError,
      handleSnapXp,
      resolveBudgetCategory,
      setBudgets,
      setTransactions,
      userId,
    ],
  );

  const updateBudgetExpense = useCallback(
    (budgetId: string, expenseId: string, amount: number, name: string, date?: Date) => {
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
    },
    [
      budgets,
      canUseDb,
      handleDbError,
      setBudgets,
      setTransactions,
    ],
  );

  const deleteBudgetExpense = useCallback(
    (budgetId: string, expenseId: string) => {
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
    },
    [canUseDb, handleDbError, setBudgets, setTransactions],
  );

  const updateBudget = useCallback(
    (budgetId: string, updates: Partial<Budget>) => {
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
    },
    [canUseDb, handleDbError, setBudgets],
  );

  const addBudget = useCallback(
    (name: string, icon: string, iconColor: string, limit: number) => {
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
    },
    [canUseDb, currency, handleDbError, resolveBudgetCategory, setBudgets, userId],
  );

  const addExpenseWithAutobudget = useCallback(
    (categoryName: string, icon: string, amount: number, name: string, date: Date) => {
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

        await handleSnapXp(transactionId);
      })();
    },
    [
      addTransaction,
      budgets,
      canUseDb,
      currency,
      handleDbError,
      handleSnapXp,
      resolveBudgetCategory,
      setBudgets,
      setTransactions,
      userId,
    ],
  );

  const deleteBudget = useCallback(
    (budgetId: string) => {
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
    },
    [budgets, canUseDb, handleDbError, setBudgets, setTransactions],
  );

  return {
    addBudgetExpense,
    updateBudgetExpense,
    deleteBudgetExpense,
    updateBudget,
    addBudget,
    addExpenseWithAutobudget,
    deleteBudget,
  };
};
