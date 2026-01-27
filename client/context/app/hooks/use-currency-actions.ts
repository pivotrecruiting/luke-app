import { useCallback } from "react";
import type { CurrencyCode } from "@/context/app/types";
import { upsertUserCurrency } from "@/services/app-service";

type UseCurrencyActionsParamsT = {
  userId: string | null;
  canUseDb: boolean;
  setCurrencyState: React.Dispatch<React.SetStateAction<CurrencyCode>>;
  handleDbError: (error: unknown, context: string) => void;
};

/**
 * Creates currency-related actions.
 */
export const useCurrencyActions = ({
  userId,
  canUseDb,
  setCurrencyState,
  handleDbError,
}: UseCurrencyActionsParamsT) => {
  const setCurrency = useCallback(
    (nextCurrency: CurrencyCode) => {
      setCurrencyState(nextCurrency);
      if (!canUseDb || !userId) return;
      void (async () => {
        try {
          await upsertUserCurrency(userId, nextCurrency);
        } catch (error) {
          handleDbError(error, "setCurrency");
        }
      })();
    },
    [canUseDb, handleDbError, setCurrencyState, userId],
  );

  return { setCurrency };
};
