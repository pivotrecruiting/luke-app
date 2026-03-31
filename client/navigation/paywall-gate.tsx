import { useEffect, useMemo, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { navigationRef } from "@/navigation/navigation-ref";

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

    if (!hasAccess) {
      return "no-access";
    }

    if (!paywallVisible) {
      return null;
    }

    return `trial:${paywallVisibleFrom ?? trialEndsAt ?? "visible"}`;
  }, [
    hasAccess,
    paywallRequired,
    paywallVisible,
    paywallVisibleFrom,
    trialEndsAt,
  ]);

  useEffect(() => {
    if (currentRouteName === "Paywall") {
      isNavigatingRef.current = false;
      return;
    }

    if (isNavigatingRef.current) return;
    if (isAppLoading || isBillingStateLoading || !isOnboardingComplete) return;
    if (!navigationRef.isReady()) return;
    if (!presentationKey) return;
    if (lastPresentedKeyRef.current === presentationKey) return;

    isNavigatingRef.current = true;
    lastPresentedKeyRef.current = presentationKey;
    navigationRef.navigate("Paywall");
  }, [
    currentRouteName,
    isAppLoading,
    isBillingStateLoading,
    isOnboardingComplete,
    presentationKey,
  ]);

  return null;
};
