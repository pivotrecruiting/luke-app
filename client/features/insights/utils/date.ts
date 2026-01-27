import type { TimeFilterT } from "../types/insights-types";

export const parseGermanDate = (dateStr: string): Date => {
  if (dateStr.startsWith("Heute") || dateStr.startsWith("Gestern")) {
    const today = new Date();
    if (dateStr.startsWith("Gestern")) {
      today.setDate(today.getDate() - 1);
    }
    return today;
  }

  let parts = dateStr.split(".");
  if (parts.length === 3) {
    return new Date(
      parseInt(parts[2]),
      parseInt(parts[1]) - 1,
      parseInt(parts[0]),
    );
  }

  parts = dateStr.split("/");
  if (parts.length === 3) {
    return new Date(
      parseInt(parts[2]),
      parseInt(parts[1]) - 1,
      parseInt(parts[0]),
    );
  }

  return new Date();
};

export const getDateRangeForFilter = (
  filter: TimeFilterT,
): { start: Date; end: Date } => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  switch (filter) {
    case "thisMonth": {
      const start = new Date(currentYear, currentMonth, 1);
      const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      return { start, end };
    }
    case "lastMonth": {
      const start = new Date(currentYear, currentMonth - 1, 1);
      const end = new Date(currentYear, currentMonth, 0, 23, 59, 59);
      return { start, end };
    }
    case "last3Months": {
      const start = new Date(currentYear, currentMonth - 2, 1);
      const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      return { start, end };
    }
    case "last6Months": {
      const start = new Date(currentYear, currentMonth - 5, 1);
      const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      return { start, end };
    }
    case "thisYear": {
      const start = new Date(currentYear, 0, 1);
      const end = new Date(currentYear, 11, 31, 23, 59, 59);
      return { start, end };
    }
    default:
      return { start: new Date(currentYear, currentMonth, 1), end: now };
  }
};
