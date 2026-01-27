import { useCallback, useMemo } from "react";
import type { IncomeCategoryRow } from "@/services/types";

type UseIncomeCategoryResolverParamsT = {
  incomeCategories: IncomeCategoryRow[];
};

const normalizeName = (value: string) => value.trim().toLowerCase();

/**
 * Resolves income categories by name.
 */
export const useIncomeCategoryResolver = ({
  incomeCategories,
}: UseIncomeCategoryResolverParamsT) => {
  const incomeCategoryMap = useMemo(() => {
    const map = new Map<string, IncomeCategoryRow>();
    incomeCategories.forEach((category) => {
      map.set(normalizeName(category.name), category);
    });
    return map;
  }, [incomeCategories]);

  const resolveIncomeCategory = useCallback(
    (name: string) => {
      if (!name) return null;
      return incomeCategoryMap.get(normalizeName(name)) ?? null;
    },
    [incomeCategoryMap],
  );

  return { resolveIncomeCategory };
};
