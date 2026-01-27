import { useCallback } from "react";
import type {
  CurrencyCode,
  Goal,
  GoalDeposit,
  Transaction,
} from "@/context/app/types";
import {
  createGoal as createGoalInDb,
  createGoalContribution,
  createTransaction,
  deleteGoal as deleteGoalInDb,
  deleteGoalContribution,
  updateGoal as updateGoalInDb,
  updateGoalContribution,
} from "@/services/app-service";
import type { UserProgressT } from "@/types/xp-types";
import { formatDate, parseFormattedDate } from "@/utils/dates";
import { generateId } from "@/utils/ids";
import { toCents } from "@/utils/money";

type GoalActionsDepsT = {
  userId: string | null;
  canUseDb: boolean;
  currency: CurrencyCode;
  isOnboardingComplete: boolean;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  handleDbError: (error: unknown, context: string) => void;
  handleSnapXp: (transactionId: string) => Promise<UserProgressT | null>;
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
  setTransactions,
  handleDbError,
  handleSnapXp,
  awardXp,
}: GoalActionsDepsT) => {
  const addGoalDeposit = useCallback(
    (goalId: string, amount: number, customDate?: Date) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const depositDate = customDate || new Date();
      const isRepayment = goal.name.toLowerCase().includes("klarna");
      const tempDepositId = generateId();
      const tempTransactionId = generateId();
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

          const progressAfterSnap = await handleSnapXp(transactionId);
          if (shouldAwardGoalReached) {
            await awardXp({
              eventKey: "goal_reached",
              sourceType: "goal",
              sourceId: goalId,
              meta: { goalId },
              progressOverride: progressAfterSnap ?? null,
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
      handleSnapXp,
      setGoals,
      setTransactions,
      userId,
    ],
  );

  const updateGoalDeposit = useCallback(
    (goalId: string, depositId: string, amount: number, date?: Date) => {
      const existingGoal = goals.find((goal) => goal.id === goalId);
      const existingDeposit = existingGoal?.deposits.find(
        (deposit) => deposit.id === depositId,
      );
      const amountDiff = existingDeposit ? amount - existingDeposit.amount : 0;
      const nextCurrent =
        existingGoal && existingDeposit
          ? existingGoal.current + amountDiff
          : null;
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

      if (!canUseDb) return;
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
    [awardXp, canUseDb, goals, handleDbError, setGoals],
  );

  const deleteGoalDeposit = useCallback(
    (goalId: string, depositId: string) => {
      setGoals((prev) =>
        prev.map((goal) => {
          if (goal.id === goalId) {
            const depositToDelete = goal.deposits.find(
              (d) => d.id === depositId,
            );
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
    },
    [canUseDb, handleDbError, setGoals],
  );

  const addGoal = useCallback(
    (name: string, icon: string, target: number) => {
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
    },
    [canUseDb, handleDbError, isOnboardingComplete, setGoals, userId],
  );

  const updateGoal = useCallback(
    (goalId: string, updates: Partial<Goal>) => {
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
