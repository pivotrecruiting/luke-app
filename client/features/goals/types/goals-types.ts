import type { Budget, Goal } from "@/context/app/types";

export type SuccessToastT = "goal" | "budget" | null;

export type GoalItemPropsT = {
  goal: Goal;
  onPress: () => void;
};

export type BudgetItemPropsT = {
  budget: Budget;
  onPress: () => void;
};

export type LevelDataT = {
  current: number;
  name: string;
  xp: number;
  xpToNextLevel: number;
  nextLevel: number;
};
