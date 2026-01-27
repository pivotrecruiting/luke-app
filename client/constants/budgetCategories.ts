export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const BUDGET_CATEGORIES: BudgetCategory[] = [
  {
    id: "takeaway",
    name: "Takeaway",
    icon: "shopping-bag",
    color: "#F97316",
  },
  {
    id: "mobilitaet",
    name: "Mobilität",
    icon: "navigation",
    color: "#3B82F6",
  },
  {
    id: "wohnen",
    name: "Wohnen",
    icon: "home",
    color: "#10B981",
  },
  {
    id: "lebensmittel",
    name: "Lebensmittel",
    icon: "shopping-cart",
    color: "#F59E0B",
  },
  {
    id: "abonnements",
    name: "Abonnements",
    icon: "repeat",
    color: "#6366F1",
  },
  {
    id: "freizeit",
    name: "Freizeit",
    icon: "sun",
    color: "#8B5CF6",
  },
  {
    id: "shoppen",
    name: "Shoppen",
    icon: "shopping-bag",
    color: "#EC4899",
  },
  {
    id: "sonstiges",
    name: "Sonstiges",
    icon: "more-horizontal",
    color: "#6B7280",
  },
];

export function getCategoryByName(name: string): BudgetCategory | undefined {
  return BUDGET_CATEGORIES.find((c) => c.name === name);
}

export function getCategoryById(id: string): BudgetCategory | undefined {
  return BUDGET_CATEGORIES.find((c) => c.id === id);
}
