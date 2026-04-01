let canAccessProfileFromPaywall = false;

export const allowProfileAccessFromPaywall = (): void => {
  canAccessProfileFromPaywall = true;
};

export const revokeProfileAccessFromPaywall = (): void => {
  canAccessProfileFromPaywall = false;
};

export const getCanAccessProfileFromPaywall = (): boolean =>
  canAccessProfileFromPaywall;
