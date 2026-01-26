import { useCallback } from "react";
import type { UserProgressT } from "@/types/xp-types";

type UseSnapXpParamsT = {
  isOnboardingComplete: boolean;
  awardXp: (params: {
    eventKey: string;
    sourceType?: string | null;
    sourceId?: string | null;
    progressOverride?: UserProgressT | null;
  }) => Promise<UserProgressT | null>;
};

/**
 * Awards XP for snap creation, including tutorial bonus when applicable.
 */
export const useSnapXp = ({
  isOnboardingComplete,
  awardXp,
}: UseSnapXpParamsT) => {
  const handleSnapXp = useCallback(
    async (transactionId: string): Promise<UserProgressT | null> => {
      const updatedProgress = await awardXp({
        eventKey: "snap_created",
        sourceType: "transaction",
        sourceId: transactionId,
      });

      if (!isOnboardingComplete) return updatedProgress ?? null;
      const tutorialProgress = await awardXp({
        eventKey: "first_snap_tutorial",
        sourceType: "transaction",
        sourceId: transactionId,
        progressOverride: updatedProgress ?? null,
      });
      return tutorialProgress ?? updatedProgress ?? null;
    },
    [awardXp, isOnboardingComplete],
  );

  return { handleSnapXp };
};
