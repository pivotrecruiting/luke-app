import { useMemo, useCallback } from "react";
import type { BudgetCategoryRow } from "@/services/types";

type UseBudgetCategoryResolverParamsT = {
  budgetCategories: BudgetCategoryRow[];
};

/**
 * Builds budget category lookup helpers.
 */
export const useBudgetCategoryResolver = ({
  budgetCategories,
}: UseBudgetCategoryResolverParamsT) => {
  const budgetCategoryByName = useMemo(() => {
    const map = new Map<string, BudgetCategoryRow>();
    budgetCategories.forEach((category) => {
      map.set(category.name.toLowerCase(), category);
      if (category.key) {
        map.set(category.key.toLowerCase(), category);
      }
    });
    return map;
  }, [budgetCategories]);

  const resolveBudgetCategory = useCallback(
    (name: string) => {
      const normalized = name.trim().toLowerCase();
      return (
        budgetCategoryByName.get(normalized) ||
        budgetCategoryByName.get("sonstiges") ||
        null
      );
    },
    [budgetCategoryByName],
  );

  return { resolveBudgetCategory };
};
