import { useCallback } from "react";

type UseWeekNavigationParamsT = {
  selectedWeekOffset: number;
  setSelectedWeekOffset: React.Dispatch<React.SetStateAction<number>>;
};

/**
 * Provides week navigation helpers.
 */
export const useWeekNavigation = ({
  selectedWeekOffset,
  setSelectedWeekOffset,
}: UseWeekNavigationParamsT) => {
  const goToPreviousWeek = useCallback(() => {
    setSelectedWeekOffset((prev) => prev - 1);
  }, [setSelectedWeekOffset]);

  const goToNextWeek = useCallback(() => {
    if (selectedWeekOffset < 0) {
      setSelectedWeekOffset((prev) => prev + 1);
    }
  }, [selectedWeekOffset, setSelectedWeekOffset]);

  return { goToPreviousWeek, goToNextWeek };
};
