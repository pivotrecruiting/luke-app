import { useCallback } from "react";
import { updateOnboardingComplete } from "@/services/app-service";
import { ONBOARDING_VERSION } from "@/context/app/constants";

type UseOnboardingActionsParamsT = {
  userId: string | null;
  canUseDb: boolean;
  setIsOnboardingComplete: React.Dispatch<React.SetStateAction<boolean>>;
  handleDbError: (error: unknown, context: string) => void;
};

/**
 * Creates onboarding-related actions.
 */
export const useOnboardingActions = ({
  userId,
  canUseDb,
  setIsOnboardingComplete,
  handleDbError,
}: UseOnboardingActionsParamsT) => {
  const completeOnboarding = useCallback(() => {
    setIsOnboardingComplete(true);
    if (!canUseDb || !userId) return;
    void (async () => {
      try {
        await updateOnboardingComplete(userId, ONBOARDING_VERSION);
      } catch (error) {
        handleDbError(error, "completeOnboarding");
      }
    })();
  }, [canUseDb, handleDbError, setIsOnboardingComplete, userId]);

  return { completeOnboarding };
};
