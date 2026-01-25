export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const BUDGET_CATEGORIES: BudgetCategory[] = [
  {
    id: "lebensmittel",
    name: "Lebensmittel",
    icon: "shopping-cart",
    color: "#F59E0B",
  },
  {
    id: "essen-trinken",
    name: "Essen & Trinken",
    icon: "coffee",
    color: "#EF4444",
  },
  { id: "feiern", name: "Feiern", icon: "music", color: "#8B5CF6" },
  { id: "shoppen", name: "Shoppen", icon: "shopping-bag", color: "#EC4899" },
  { id: "sprit", name: "Sprit", icon: "truck", color: "#6366F1" },
  { id: "auswaerts", name: "Auswärts", icon: "map-pin", color: "#10B981" },
  { id: "freizeit", name: "Freizeit", icon: "sun", color: "#F97316" },
  { id: "events", name: "Events", icon: "calendar", color: "#3B82F6" },
  { id: "mobilitaet", name: "Mobilität", icon: "navigation", color: "#14B8A6" },
  { id: "coffee", name: "Coffee 2 go", icon: "coffee", color: "#78350F" },
];

export function getCategoryByName(name: string): BudgetCategory | undefined {
  return BUDGET_CATEGORIES.find((c) => c.name === name);
}

export function getCategoryById(id: string): BudgetCategory | undefined {
  return BUDGET_CATEGORIES.find((c) => c.id === id);
}
