import { useCallback } from "react";
import type {
  CurrencyCode,
  Goal,
  GoalDeposit,
  VaultTransactionT,
} from "@/context/app/types";
import {
  createGoal as createGoalInDb,
  createGoalContribution,
  createVaultTransaction,
  deleteGoal as deleteGoalInDb,
  deleteGoalContribution,
  updateGoal as updateGoalInDb,
  updateGoalContribution,
} from "@/services/app-service";
import { formatDate, parseFormattedDate } from "@/utils/dates";
import { generateId } from "@/utils/ids";
import { toCents } from "@/utils/money";
import type { UserProgressT } from "@/types/xp-types";

type GoalActionsDepsT = {
  userId: string | null;
  canUseDb: boolean;
  currency: CurrencyCode;
  isOnboardingComplete: boolean;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  setVaultTransactions: React.Dispatch<
    React.SetStateAction<VaultTransactionT[]>
  >;
  vaultBalance: number;
  deleteTransaction: (transactionId: string) => void;
  handleDbError: (error: unknown, context: string) => void;
  awardXp: (params: {
    eventKey: string;
    sourceType?: string | null;
    sourceId?: string | null;
    meta?: Record<string, unknown> | null;
    progressOverride?: UserProgressT | null;
  }) => Promise<UserProgressT | null>;
};

/**
 * Creates actions for goals and goal deposits.
 */
export const useGoalActions = ({
  userId,
  canUseDb,
  currency,
  isOnboardingComplete,
  goals,
  setGoals,
  setVaultTransactions,
  vaultBalance,
  deleteTransaction,
  handleDbError,
  awardXp,
}: GoalActionsDepsT) => {
  const appendVaultGoalTransaction = useCallback(
    (
      amount: number,
      goalId: string,
      note: string,
      transactionAt: Date = new Date(),
    ) => {
      if (!Number.isFinite(amount) || amount === 0) return;

      const tempId = generateId();
      const transactionAtIso = transactionAt.toISOString();
      setVaultTransactions((prev) => [
        {
          id: tempId,
          amount,
          entryType: "goal_deposit",
          note,
          goalId,
          rolloverMonth: null,
          transactionAt: transactionAtIso,
        },
        ...prev,
      ]);

      if (!canUseDb || !userId) return;
      void (async () => {
        try {
          const vaultTransactionId = await createVaultTransaction({
            user_id: userId,
            amount_cents: toCents(amount),
            currency,
            entry_type: "goal_deposit",
            note,
            goal_id: goalId,
            transaction_at: transactionAtIso,
          });

          setVaultTransactions((prev) =>
            prev.map((entry) =>
              entry.id === tempId
                ? { ...entry, id: vaultTransactionId }
                : entry,
            ),
          );
        } catch (error) {
          handleDbError(error, "appendVaultGoalTransaction");
        }
      })();
    },
    [canUseDb, currency, handleDbError, setVaultTransactions, userId],
  );

  const addGoalDeposit = useCallback(
    (goalId: string, amount: number, customDate?: Date) => {
      if (amount <= 0 || amount > vaultBalance) return;

      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const depositDate = customDate || new Date();
      const isRepayment = goal.name.toLowerCase().includes("klarna");
      const tempDepositId = generateId();
      const shouldAwardGoalReached =
        goal.current < goal.target && goal.current + amount >= goal.target;

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
      appendVaultGoalTransaction(
        -amount,
        goalId,
        `Goal: ${goal.name}`,
        depositDate,
      );

      if (!canUseDb || !userId) return;
      void (async () => {
        try {
          const contributionId = await createGoalContribution({
            user_id: userId,
            goal_id: goalId,
            amount_cents: toCents(amount),
            currency,
            contribution_type: isRepayment ? "repayment" : "deposit",
            contribution_at: depositDate.toISOString(),
          });

          setGoals((prev) =>
            prev.map((g) => {
              if (g.id !== goalId) return g;
              return {
                ...g,
                deposits: g.deposits.map((deposit) =>
                  deposit.id === tempDepositId
                    ? {
                        ...deposit,
                        id: contributionId,
                      }
                    : deposit,
                ),
              };
            }),
          );
          if (shouldAwardGoalReached) {
            await awardXp({
              eventKey: "goal_reached",
              sourceType: "goal",
              sourceId: goalId,
              meta: { goalId },
            });
          }
        } catch (error) {
          handleDbError(error, "addGoalDeposit");
        }
      })();
    },
    [
      awardXp,
      canUseDb,
      currency,
      goals,
      handleDbError,
      appendVaultGoalTransaction,
      setGoals,
      userId,
      vaultBalance,
    ],
  );

  const updateGoalDeposit = useCallback(
    (goalId: string, depositId: string, amount: number, date?: Date) => {
      const existingGoal = goals.find((goal) => goal.id === goalId);
      const existingDeposit = existingGoal?.deposits.find(
        (deposit) => deposit.id === depositId,
      );
      if (!existingGoal || !existingDeposit) return;

      const amountDiff = amount - existingDeposit.amount;
      if (amountDiff > 0 && amountDiff > vaultBalance) return;

      const nextCurrent = existingGoal.current + amountDiff;
      const shouldAwardGoalReached = Boolean(
        existingGoal &&
          existingDeposit &&
          existingGoal.current < existingGoal.target &&
          typeof nextCurrent === "number" &&
          nextCurrent >= existingGoal.target,
      );

      setGoals((prev) =>
        prev.map((goal) => {
          if (goal.id === goalId) {
            const oldDeposit = goal.deposits.find((d) => d.id === depositId);
            if (!oldDeposit) return goal;

            const innerAmountDiff = amount - oldDeposit.amount;
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

            const newCurrent = goal.current + innerAmountDiff;
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

      if (amountDiff !== 0) {
        appendVaultGoalTransaction(
          -amountDiff,
          goalId,
          `Goal Anpassung: ${existingGoal.name}`,
        );
      }

      if (!canUseDb) return;
      const fallbackDate = parseFormattedDate(existingDeposit.date);
      const contributionAt = date || fallbackDate;
      void (async () => {
        try {
          await updateGoalContribution(depositId, {
            amount_cents: toCents(amount),
            contribution_at: contributionAt.toISOString(),
          });

          if (shouldAwardGoalReached) {
            await awardXp({
              eventKey: "goal_reached",
              sourceType: "goal",
              sourceId: goalId,
              meta: { goalId },
            });
          }
        } catch (error) {
          handleDbError(error, "updateGoalDeposit");
        }
      })();
    },
    [
      appendVaultGoalTransaction,
      awardXp,
      canUseDb,
      goals,
      handleDbError,
      setGoals,
      vaultBalance,
    ],
  );

  const deleteGoalDeposit = useCallback(
    (goalId: string, depositId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      const depositToDelete = goal?.deposits.find((d) => d.id === depositId);
      const transactionIdToRemove = depositToDelete?.transactionId;

      setGoals((prev) =>
        prev.map((g) => {
          if (g.id !== goalId) return g;
          const deposit = g.deposits.find((d) => d.id === depositId);
          if (!deposit) return g;
          const newCurrent = g.current - deposit.amount;
          const newRemaining = Math.max(0, g.target - newCurrent);
          return {
            ...g,
            current: Math.max(0, newCurrent),
            remaining: newRemaining,
            deposits: g.deposits.filter((d) => d.id !== depositId),
          };
        }),
      );

      if (transactionIdToRemove) {
        deleteTransaction(transactionIdToRemove);
      }
      if (goal && depositToDelete) {
        appendVaultGoalTransaction(
          depositToDelete.amount,
          goalId,
          `Goal Rückbuchung: ${goal.name}`,
        );
      }

      if (!canUseDb) return;
      void (async () => {
        try {
          await deleteGoalContribution(depositId);
        } catch (error) {
          handleDbError(error, "deleteGoalDeposit");
        }
      })();
    },
    [
      appendVaultGoalTransaction,
      canUseDb,
      deleteTransaction,
      goals,
      handleDbError,
      setGoals,
    ],
  );

  const addGoal = useCallback(
    (
      name: string,
      icon: string,
      target: number,
      monthlyContribution?: number | null,
    ) => {
      const normalizedMonthlyContribution =
        typeof monthlyContribution === "number" && monthlyContribution > 0
          ? monthlyContribution
          : null;
      const tempId = generateId();
      const newGoal: Goal = {
        id: tempId,
        name,
        icon,
        target,
        monthlyContribution: normalizedMonthlyContribution,
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
            normalizedMonthlyContribution,
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
    },
    [canUseDb, handleDbError, isOnboardingComplete, setGoals, userId],
  );

  const updateGoal = useCallback(
    (goalId: string, updates: Partial<Goal>) => {
      setGoals((prev) =>
        prev.map((goal) => {
          if (goal.id === goalId) {
            const nextTarget =
              typeof updates.target === "number" ? updates.target : goal.target;
            const nextCurrent =
              typeof updates.current === "number"
                ? updates.current
                : goal.current;
            const nextRemaining = Math.max(0, nextTarget - nextCurrent);
            const nextMonthlyContribution =
              updates.monthlyContribution !== undefined
                ? updates.monthlyContribution
                : goal.monthlyContribution;
            return {
              ...goal,
              ...updates,
              target: nextTarget,
              current: nextCurrent,
              remaining: nextRemaining,
              monthlyContribution: nextMonthlyContribution,
            };
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
    },
    [canUseDb, handleDbError, setGoals],
  );

  const deleteGoal = useCallback(
    (goalId: string) => {
      setGoals((prev) => prev.filter((goal) => goal.id !== goalId));

      if (!canUseDb) return;
      void (async () => {
        try {
          await deleteGoalInDb(goalId);
        } catch (error) {
          handleDbError(error, "deleteGoal");
        }
      })();
    },
    [canUseDb, handleDbError, setGoals],
  );

  return {
    addGoalDeposit,
    updateGoalDeposit,
    deleteGoalDeposit,
    addGoal,
    updateGoal,
    deleteGoal,
  };
};
