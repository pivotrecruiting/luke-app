import { useEffect, useMemo, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { navigationRef } from "@/navigation/navigation-ref";
import {
  getCanAccessProfileFromPaywall,
  revokeProfileAccessFromPaywall,
} from "@/navigation/paywall-navigation-state";
import { getHasPresentedExpiredWorkshopCat } from "@/navigation/workshop-retention-state";

type PaywallGateProps = {
  currentRouteName: string | null;
};

/**
 * Opens the paywall modal when the server-driven paywall state becomes visible.
 */
export const PaywallGate = ({ currentRouteName }: PaywallGateProps) => {
  const {
    isOnboardingComplete,
    isAppLoading,
    isBillingStateLoading,
    hasAccess,
    hadWorkshopAccess,
    paywallRequired,
    paywallVisible,
    trialEndsAt,
    paywallVisibleFrom,
  } = useApp();
  const isNavigatingRef = useRef(false);
  const lastPresentedKeyRef = useRef<string | null>(null);

  const presentationKey = useMemo(() => {
    if (!paywallRequired) {
      return null;
    }

    if (
      !hasAccess &&
      hadWorkshopAccess &&
      !getHasPresentedExpiredWorkshopCat()
    ) {
      return null;
    }

    if (hasAccess && paywallVisible) {
      return null;
    }

    if (!hasAccess) {
      return "no-access";
    }

    return `trial:${paywallVisibleFrom ?? trialEndsAt ?? "visible"}`;
  }, [
    hasAccess,
    hadWorkshopAccess,
    paywallRequired,
    paywallVisible,
    paywallVisibleFrom,
    trialEndsAt,
  ]);
  const shouldForceReopenPaywall = Boolean(presentationKey) && !hasAccess;

  useEffect(() => {
    if (currentRouteName !== "Profile") {
      revokeProfileAccessFromPaywall();
    }
  }, [currentRouteName]);

  useEffect(() => {
    if (currentRouteName === "Paywall") {
      isNavigatingRef.current = false;
      return;
    }

    if (isNavigatingRef.current) return;
    if (isAppLoading || isBillingStateLoading || !isOnboardingComplete) return;
    if (!navigationRef.isReady()) return;
    if (!presentationKey) return;
    if (currentRouteName === "Profile" && getCanAccessProfileFromPaywall()) {
      return;
    }
    if (
      !shouldForceReopenPaywall &&
      lastPresentedKeyRef.current === presentationKey
    ) {
      return;
    }

    isNavigatingRef.current = true;
    lastPresentedKeyRef.current = presentationKey;
    navigationRef.navigate("Paywall");
  }, [
    currentRouteName,
    isAppLoading,
    isBillingStateLoading,
    isOnboardingComplete,
    presentationKey,
    shouldForceReopenPaywall,
  ]);

  return null;
};
