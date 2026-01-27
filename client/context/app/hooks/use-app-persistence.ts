import { useEffect } from "react";
import type { PersistedData } from "@/context/app/types";
import { savePersistedData } from "@/services/local-storage";

type UseAppPersistenceParamsT = {
  isAppLoading: boolean;
  useLocalFallback: boolean;
  data: PersistedData;
};

/**
 * Persists app data to local storage when DB is unavailable.
 */
export const useAppPersistence = ({
  isAppLoading,
  useLocalFallback,
  data,
}: UseAppPersistenceParamsT) => {
  useEffect(() => {
    if (isAppLoading || !useLocalFallback) return;
    void (async () => {
      try {
        await savePersistedData(data);
      } catch (e) {
        console.error("Failed to save data to storage:", e);
      }
    })();
  }, [data, isAppLoading, useLocalFallback]);
};
