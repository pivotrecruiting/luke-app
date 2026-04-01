import { useEffect, useMemo, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { navigationRef } from "@/navigation/navigation-ref";
import {
  markExpiredWorkshopCatPresented,
  resetExpiredWorkshopCatPresented,
} from "@/navigation/workshop-retention-state";

type CatGateProps = {
  currentRouteName: string | null;
};

/**
 * Presents the cat retention screen for workshop participants after their access expired.
 */
export const CatGate = ({ currentRouteName }: CatGateProps) => {
  const {
    hasAccess,
    paywallRequired,
    hadWorkshopAccess,
    isOnboardingComplete,
    isAppLoading,
    isBillingStateLoading,
  } = useApp();
  const isNavigatingRef = useRef(false);
  const lastPresentedKeyRef = useRef<string | null>(null);

  const presentationKey = useMemo(() => {
    if (hasAccess || !paywallRequired || !hadWorkshopAccess) {
      return null;
    }

    return "workshop-expired";
  }, [hadWorkshopAccess, hasAccess, paywallRequired]);

  useEffect(() => {
    if (!presentationKey) {
      resetExpiredWorkshopCatPresented();
    }
  }, [presentationKey]);

  useEffect(() => {
    if (currentRouteName === "Cat") {
      isNavigatingRef.current = false;
      return;
    }

    if (isNavigatingRef.current) return;
    if (isAppLoading || isBillingStateLoading || !isOnboardingComplete) return;
    if (!navigationRef.isReady()) return;
    if (!presentationKey) return;
    if (currentRouteName === "Paywall") return;
    if (currentRouteName === "LevelUp" || currentRouteName === "Streak") {
      return;
    }
    if (lastPresentedKeyRef.current === presentationKey) return;

    isNavigatingRef.current = true;
    lastPresentedKeyRef.current = presentationKey;
    markExpiredWorkshopCatPresented();
    navigationRef.navigate("Cat");
  }, [
    currentRouteName,
    isAppLoading,
    isBillingStateLoading,
    isOnboardingComplete,
    presentationKey,
  ]);

  return null;
};
