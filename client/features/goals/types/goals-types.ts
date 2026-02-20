import type { Budget, Goal } from "@/context/app/types";

export type SuccessToastT = "goal" | "budget" | null;

export type GoalItemPropsT = {
  goal: Goal;
  onPress: () => void;
  onDepositPress: (goal: Goal) => void;
};

export type BudgetItemPropsT = {
  budget: Budget;
  onPress: () => void;
};
