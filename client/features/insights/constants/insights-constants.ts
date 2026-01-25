import type {
  ExpenseTypeT,
  IncomeTypeT,
  TimeFilterOptionT,
} from "../types/insights-types";

export const INCOME_TYPES: IncomeTypeT[] = [
  { id: "gehalt", name: "Gehalt", icon: "briefcase" },
  { id: "nebenjob", name: "Nebenjob", icon: "clock" },
  { id: "freelance", name: "Freelance", icon: "code" },
  { id: "mieteinnahmen", name: "Mieteinnahmen", icon: "home" },
  { id: "dividenden", name: "Dividenden", icon: "trending-up" },
  { id: "kindergeld", name: "Kindergeld", icon: "users" },
  { id: "rente", name: "Rente", icon: "award" },
  { id: "sonstiges", name: "Sonstiges", icon: "plus-circle" },
];

export const EXPENSE_TYPES: ExpenseTypeT[] = [
  { id: "versicherungen", name: "Versicherungen", icon: "shield" },
  { id: "netflix", name: "Netflix", icon: "tv" },
  { id: "wohnen", name: "Wohnen", icon: "home" },
  { id: "handy", name: "Handy", icon: "smartphone" },
  { id: "altersvorsorge", name: "Altersvorsorge", icon: "umbrella" },
  { id: "spotify", name: "Spotify", icon: "music" },
  { id: "fitness", name: "Fitness", icon: "activity" },
  { id: "abos", name: "Abos", icon: "repeat" },
  { id: "fahrticket", name: "Fahrticket", icon: "navigation" },
  { id: "sonstiges", name: "Sonstiges", icon: "plus-circle" },
];

export const TIME_FILTER_OPTIONS: TimeFilterOptionT[] = [
  { id: "thisMonth", label: "Dieser Monat" },
  { id: "lastMonth", label: "Letzter Monat" },
  { id: "last3Months", label: "3 Monate" },
  { id: "last6Months", label: "6 Monate" },
  { id: "thisYear", label: "Dieses Jahr" },
];

export const CATEGORY_COLORS: Record<string, string> = {
  Lebensmittel: "#3B5BDB",
  Transport: "#7B8CDE",
  Unterhaltung: "#5C7CFA",
  Shopping: "#748FFC",
  Restaurant: "#91A7FF",
  Gesundheit: "#BAC8FF",
  Sonstiges: "#DBE4FF",
};
