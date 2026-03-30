import { useEffect, useState } from "react";
import { AppState } from "react-native";

const DEFAULT_REFRESH_INTERVAL_MS = 60_000;

/**
 * Returns a periodically refreshed reference date and updates immediately on app foreground.
 */
export const useCurrentReferenceDate = (
  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
): Date => {
  const [referenceDate, setReferenceDate] = useState(() => new Date());

  useEffect(() => {
    const refreshReferenceDate = () => {
      setReferenceDate(new Date());
    };

    const intervalId = setInterval(refreshReferenceDate, refreshIntervalMs);
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        refreshReferenceDate();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [refreshIntervalMs]);

  return referenceDate;
};
