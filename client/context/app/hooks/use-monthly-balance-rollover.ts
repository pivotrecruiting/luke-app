import { useEffect, useMemo, useRef } from "react";
import type {
  CurrencyCode,
  Transaction,
  VaultTransactionT,
} from "@/context/app/types";
import {
  createVaultTransaction,
  upsertBalanceAnchorMonth,
} from "@/services/app-service";
import { parseFormattedDate } from "@/utils/dates";
import { generateId } from "@/utils/ids";
import { toCents } from "@/utils/money";

type UseMonthlyBalanceRolloverParamsT = {
  userId: string | null;
  canUseDb: boolean;
  currency: CurrencyCode;
  isAppLoading: boolean;
  transactions: Transaction[];
  vaultTransactions: VaultTransactionT[];
  balanceAnchorMonth: string | null;
  setVaultTransactions: React.Dispatch<
    React.SetStateAction<VaultTransactionT[]>
  >;
  setBalanceAnchorMonth: React.Dispatch<React.SetStateAction<string | null>>;
  handleDbError: (error: unknown, context: string) => void;
};

const padMonthNumber = (value: number): string =>
  value.toString().padStart(2, "0");

const toMonthStart = (date: Date): string =>
  `${date.getFullYear()}-${padMonthNumber(date.getMonth() + 1)}-01`;

const parseMonthStart = (monthStart: string): Date => {
  const [year, month, day] = monthStart.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0);
};

const getNextMonthStart = (monthStart: string): string => {
  const date = parseMonthStart(monthStart);
  date.setMonth(date.getMonth() + 1);
  return toMonthStart(date);
};

const isMonthBefore = (left: string, right: string): boolean =>
  parseMonthStart(left).getTime() < parseMonthStart(right).getTime();

/**
 * Applies idempotent monthly rollovers by transferring the closed month balance into vault history.
 */
export const useMonthlyBalanceRollover = ({
  userId,
  canUseDb,
  currency,
  isAppLoading,
  transactions,
  vaultTransactions,
  balanceAnchorMonth,
  setVaultTransactions,
  setBalanceAnchorMonth,
  handleDbError,
}: UseMonthlyBalanceRolloverParamsT) => {
  const isProcessingRef = useRef(false);

  const monthBalanceMap = useMemo(() => {
    const map = new Map<string, number>();

    transactions.forEach((transaction) => {
      const transactionDate = transaction.timestamp
        ? new Date(transaction.timestamp)
        : parseFormattedDate(transaction.date);
      const monthStart = toMonthStart(transactionDate);
      map.set(monthStart, (map.get(monthStart) ?? 0) + transaction.amount);
    });

    vaultTransactions.forEach((entry) => {
      if (entry.entryType !== "manual_deposit") return;
      const monthStart = toMonthStart(new Date(entry.transactionAt));
      map.set(monthStart, (map.get(monthStart) ?? 0) - entry.amount);
    });

    return map;
  }, [transactions, vaultTransactions]);

  useEffect(() => {
    if (isAppLoading || isProcessingRef.current) return;

    let active = true;
    isProcessingRef.current = true;

    const syncRollover = async () => {
      try {
        const currentMonthStart = toMonthStart(new Date());

        if (!balanceAnchorMonth) {
          setBalanceAnchorMonth(currentMonthStart);
          if (canUseDb && userId) {
            try {
              await upsertBalanceAnchorMonth(userId, currentMonthStart);
            } catch (error) {
              handleDbError(error, "monthlyBalanceRollover.initAnchor");
            }
          }
          return;
        }

        let monthCursor = balanceAnchorMonth;
        while (isMonthBefore(monthCursor, currentMonthStart)) {
          const alreadyTransferred = vaultTransactions.some(
            (entry) =>
              entry.entryType === "monthly_rollover" &&
              entry.rolloverMonth === monthCursor,
          );

          if (!alreadyTransferred) {
            const transferAmount = monthBalanceMap.get(monthCursor) ?? 0;
            if (transferAmount !== 0) {
              const transferAt = parseMonthStart(
                getNextMonthStart(monthCursor),
              ).toISOString();
              const tempId = generateId();

              setVaultTransactions((prev) => [
                {
                  id: tempId,
                  amount: transferAmount,
                  entryType: "monthly_rollover",
                  note: `Monatsabschluss ${monthCursor}`,
                  goalId: null,
                  rolloverMonth: monthCursor,
                  transactionAt: transferAt,
                },
                ...prev,
              ]);

              if (canUseDb && userId) {
                try {
                  const vaultTransactionId = await createVaultTransaction({
                    user_id: userId,
                    amount_cents: toCents(transferAmount),
                    currency,
                    entry_type: "monthly_rollover",
                    note: `Monatsabschluss ${monthCursor}`,
                    rollover_month: monthCursor,
                    transaction_at: transferAt,
                  });

                  if (!active) return;

                  setVaultTransactions((prev) =>
                    prev.map((entry) =>
                      entry.id === tempId
                        ? { ...entry, id: vaultTransactionId }
                        : entry,
                    ),
                  );
                } catch (error) {
                  handleDbError(
                    error,
                    "monthlyBalanceRollover.createVaultTransaction",
                  );
                }
              }
            }
          }

          monthCursor = getNextMonthStart(monthCursor);
        }

        if (monthCursor !== balanceAnchorMonth) {
          setBalanceAnchorMonth(monthCursor);
          if (canUseDb && userId) {
            try {
              await upsertBalanceAnchorMonth(userId, monthCursor);
            } catch (error) {
              handleDbError(error, "monthlyBalanceRollover.updateAnchor");
            }
          }
        }
      } finally {
        isProcessingRef.current = false;
      }
    };

    void syncRollover();

    return () => {
      active = false;
      isProcessingRef.current = false;
    };
  }, [
    balanceAnchorMonth,
    canUseDb,
    currency,
    handleDbError,
    isAppLoading,
    monthBalanceMap,
    setBalanceAnchorMonth,
    setVaultTransactions,
    userId,
    vaultTransactions,
  ]);
};
