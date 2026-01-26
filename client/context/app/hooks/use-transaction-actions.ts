import { useCallback } from "react";
import type { CurrencyCode, Transaction } from "@/context/app/types";
import {
  createTransaction,
  deleteTransaction as deleteTransactionInDb,
  updateTransaction as updateTransactionInDb,
} from "@/services/app-service";
import { parseFormattedDate } from "@/utils/dates";
import { generateId } from "@/utils/ids";
import { toCents } from "@/utils/money";

export type AddTransactionInputT = Omit<Transaction, "id">;

type TransactionActionsDepsT = {
  userId: string | null;
  canUseDb: boolean;
  currency: CurrencyCode;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  resolveBudgetCategory: (name: string) => { id: string } | null;
  handleDbError: (error: unknown, context: string) => void;
  handleSnapXp: (transactionId: string) => Promise<unknown>;
};

/**
 * Creates actions for transactions.
 */
export const useTransactionActions = ({
  userId,
  canUseDb,
  currency,
  setTransactions,
  resolveBudgetCategory,
  handleDbError,
  handleSnapXp,
}: TransactionActionsDepsT) => {
  const addTransaction = useCallback(
    (transaction: AddTransactionInputT) => {
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
          await handleSnapXp(transactionId);
        } catch (error) {
          handleDbError(error, "addTransaction");
        }
      })();
    },
    [
      canUseDb,
      currency,
      handleDbError,
      handleSnapXp,
      resolveBudgetCategory,
      setTransactions,
      userId,
    ],
  );

  const updateTransaction = useCallback(
    (transactionId: string, updates: Partial<Omit<Transaction, "id">>) => {
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
    },
    [canUseDb, handleDbError, setTransactions],
  );

  const deleteTransaction = useCallback(
    (transactionId: string) => {
      setTransactions((prev) => prev.filter((tx) => tx.id !== transactionId));

      if (!canUseDb) return;
      void (async () => {
        try {
          await deleteTransactionInDb(transactionId);
        } catch (error) {
          handleDbError(error, "deleteTransaction");
        }
      })();
    },
    [canUseDb, handleDbError, setTransactions],
  );

  return {
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
};
