import { useEffect, useMemo, useRef } from "react";
import type {
  MonthlyBalanceSnapshotT,
  VaultTransactionT,
} from "@/context/app/types";
import {
  fetchMonthlyBalanceState,
  syncMonthlyBalanceState,
} from "@/services/app-service";

type UseMonthlyBalanceStateSyncParamsT = {
  userId: string | null;
  canUseDb: boolean;
  isAppLoading: boolean;
  referenceDate: Date;
  setVaultTransactions: React.Dispatch<
    React.SetStateAction<VaultTransactionT[]>
  >;
  setMonthlyBalanceSnapshots: React.Dispatch<
    React.SetStateAction<MonthlyBalanceSnapshotT[]>
  >;
  setBalanceAnchorMonth: React.Dispatch<React.SetStateAction<string | null>>;
  handleDbError: (error: unknown, context: string) => void;
};

const padMonthNumber = (value: number): string =>
  value.toString().padStart(2, "0");

const toMonthStart = (date: Date): string =>
  `${date.getFullYear()}-${padMonthNumber(date.getMonth() + 1)}-01`;

/**
 * Syncs server-authoritative monthly balance state whenever the active month changes.
 */
export const useMonthlyBalanceStateSync = ({
  userId,
  canUseDb,
  isAppLoading,
  referenceDate,
  setVaultTransactions,
  setMonthlyBalanceSnapshots,
  setBalanceAnchorMonth,
  handleDbError,
}: UseMonthlyBalanceStateSyncParamsT) => {
  const currentMonthStart = useMemo(
    () => toMonthStart(referenceDate),
    [referenceDate],
  );
  const lastSyncedMonthRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || !canUseDb || isAppLoading) {
      return;
    }

    if (lastSyncedMonthRef.current === null) {
      lastSyncedMonthRef.current = currentMonthStart;
      return;
    }

    if (lastSyncedMonthRef.current === currentMonthStart) {
      return;
    }

    let active = true;
    lastSyncedMonthRef.current = currentMonthStart;

    void (async () => {
      try {
        await syncMonthlyBalanceState();
        const nextState = await fetchMonthlyBalanceState(userId);
        if (!active) {
          return;
        }

        setVaultTransactions(nextState.vaultTransactions);
        setMonthlyBalanceSnapshots(nextState.monthlyBalanceSnapshots);
        setBalanceAnchorMonth(nextState.balanceAnchorMonth);
      } catch (error) {
        if (active) {
          handleDbError(error, "monthlyBalanceStateSync");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [
    canUseDb,
    currentMonthStart,
    handleDbError,
    isAppLoading,
    setBalanceAnchorMonth,
    setMonthlyBalanceSnapshots,
    setVaultTransactions,
    userId,
  ]);
};
