import type { GoalDeposit } from "@/context/app/types";

export type DepositDateInfoT = {
  month: number;
  year: number;
  date: Date;
};

export type GroupedDepositsT = Record<string, GoalDeposit[]>;
