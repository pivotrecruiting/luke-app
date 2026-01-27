import type { DepositDateInfoT } from "../types/goal-detail-types";

export const parseDepositDate = (dateStr: string): DepositDateInfoT | null => {
  const now = new Date();
  if (dateStr.startsWith("Heute")) {
    return { month: now.getMonth(), year: now.getFullYear(), date: now };
  }
  if (dateStr === "Gestern") {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      month: yesterday.getMonth(),
      year: yesterday.getFullYear(),
      date: yesterday,
    };
  }
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const date = new Date(
      parseInt(match[3], 10),
      parseInt(match[2], 10) - 1,
      parseInt(match[1], 10),
    );
    return { month: date.getMonth(), year: date.getFullYear(), date };
  }
  return null;
};

export const formatDisplayDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};
