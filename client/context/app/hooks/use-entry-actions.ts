import { useCallback } from "react";
import type {
  CurrencyCode,
  ExpenseEntry,
  IncomeEntry,
} from "@/context/app/types";
import {
  createExpenseEntry,
  createIncomeEntry,
  deleteExpenseEntry as deleteExpenseEntryInDb,
  deleteIncomeEntry as deleteIncomeEntryInDb,
  replaceExpenseEntries,
  replaceIncomeEntries,
  updateExpenseEntry as updateExpenseEntryInDb,
  updateIncomeEntry as updateIncomeEntryInDb,
} from "@/services/app-service";
import { generateId } from "@/utils/ids";

type EntryActionsDepsT = {
  userId: string | null;
  canUseDb: boolean;
  currency: CurrencyCode;
  setIncomeEntries: React.Dispatch<React.SetStateAction<IncomeEntry[]>>;
  setExpenseEntries: React.Dispatch<React.SetStateAction<ExpenseEntry[]>>;
  handleDbError: (error: unknown, context: string) => void;
};

/**
 * Creates actions for income and expense entries.
 */
export const useEntryActions = ({
  userId,
  canUseDb,
  currency,
  setIncomeEntries,
  setExpenseEntries,
  handleDbError,
}: EntryActionsDepsT) => {
  const addIncomeEntry = useCallback(
    (type: string, amount: number) => {
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
    },
    [canUseDb, currency, handleDbError, setIncomeEntries, userId],
  );

  const addExpenseEntry = useCallback(
    (type: string, amount: number) => {
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
    },
    [canUseDb, currency, handleDbError, setExpenseEntries, userId],
  );

  const setIncomeEntriesFromOnboarding = useCallback(
    (entries: { type: string; amount: number }[]) => {
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
    },
    [canUseDb, currency, handleDbError, setIncomeEntries, userId],
  );

  const setExpenseEntriesFromOnboarding = useCallback(
    (entries: { type: string; amount: number }[]) => {
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
    },
    [canUseDb, currency, handleDbError, setExpenseEntries, userId],
  );

  const updateIncomeEntry = useCallback(
    (id: string, type: string, amount: number) => {
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
    },
    [canUseDb, handleDbError, setIncomeEntries],
  );

  const deleteIncomeEntry = useCallback(
    (id: string) => {
      setIncomeEntries((prev) => prev.filter((entry) => entry.id !== id));

      if (!canUseDb) return;
      void (async () => {
        try {
          await deleteIncomeEntryInDb(id);
        } catch (error) {
          handleDbError(error, "deleteIncomeEntry");
        }
      })();
    },
    [canUseDb, handleDbError, setIncomeEntries],
  );

  const updateExpenseEntry = useCallback(
    (id: string, type: string, amount: number) => {
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
    },
    [canUseDb, handleDbError, setExpenseEntries],
  );

  const deleteExpenseEntry = useCallback(
    (id: string) => {
      setExpenseEntries((prev) => prev.filter((entry) => entry.id !== id));

      if (!canUseDb) return;
      void (async () => {
        try {
          await deleteExpenseEntryInDb(id);
        } catch (error) {
          handleDbError(error, "deleteExpenseEntry");
        }
      })();
    },
    [canUseDb, handleDbError, setExpenseEntries],
  );

  return {
    addIncomeEntry,
    addExpenseEntry,
    setIncomeEntriesFromOnboarding,
    setExpenseEntriesFromOnboarding,
    updateIncomeEntry,
    deleteIncomeEntry,
    updateExpenseEntry,
    deleteExpenseEntry,
  };
};
