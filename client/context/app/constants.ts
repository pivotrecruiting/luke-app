import type {
  Budget,
  ExpenseEntry,
  Goal,
  IncomeEntry,
  Transaction,
} from "./types";

export const STORAGE_KEY = "@luke_app_data";
export const ONBOARDING_VERSION = "v1";

export const INITIAL_INCOME_ENTRIES: IncomeEntry[] = [];
export const INITIAL_EXPENSE_ENTRIES: ExpenseEntry[] = [];
export const INITIAL_GOALS: Goal[] = [];
export const INITIAL_BUDGETS: Budget[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const CATEGORY_COLORS: Record<string, string> = {
  Lebensmittel: "#3B5BDB",
  Shopping: "#9D4EDD",
  Wohnen: "#C77DFF",
  Abonnements: "#7B8CDE",
  Hygiene: "#B8C4E9",
  Sonstiges: "#6B7280",
};

export const AUTOBUDGET_CATEGORY_COLORS: Record<string, string> = {
  Lebensmittel: "#3B5BDB",
  Transport: "#7B8CDE",
  Unterhaltung: "#5C7CFA",
  Shopping: "#748FFC",
  Restaurant: "#91A7FF",
  Gesundheit: "#BAC8FF",
  Hygiene: "#B8C4E9",
  Feiern: "#9D4EDD",
  Sonstiges: "#DBE4FF",
};

export const GERMAN_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];
