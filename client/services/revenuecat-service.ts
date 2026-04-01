import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import { notifyAccessStateChanged } from "@/services/access-service";

export type RevenueCatPlanT = "monthly" | "yearly" | "lifetime";

export type RevenueCatPackageOptionT = {
  plan: RevenueCatPlanT;
  title: string;
  priceText: string;
  description: string;
  badge?: string;
  packageToPurchase: PurchasesPackage;
};

export type RevenueCatPurchaseResultT =
  | {
      status: "purchased";
      customerInfo: CustomerInfo;
      productIdentifier: string;
    }
  | {
      status: "cancelled" | "pending";
      message: string;
    };

export type RevenueCatRestoreResultT = {
  customerInfo: CustomerInfo;
};

type RevenueCatInitializationResultT =
  | { status: "ready" }
  | { status: "unsupported" }
  | { status: "missing_api_key" };

const SUPPORTED_PLATFORMS = new Set(["ios", "android"]);
let initializedAppUserId: string | null = null;
let hasConfiguredPurchases = false;

const customerInfoUpdateListener = () => {
  notifyAccessStateChanged();
};

const isSupportedPlatform = (): boolean => SUPPORTED_PLATFORMS.has(Platform.OS);

const getApiKeyForCurrentPlatform = (): string | null => {
  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() ?? null;
  }

  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() ?? null;
  }

  return null;
};

const formatPackageDescription = (aPackage: PurchasesPackage): string => {
  if (aPackage.packageType === PACKAGE_TYPE.MONTHLY) {
    return "monatliche Abrechnung";
  }

  if (aPackage.packageType === PACKAGE_TYPE.ANNUAL) {
    return "jährliche Abrechnung";
  }

  if (aPackage.packageType === PACKAGE_TYPE.LIFETIME) {
    return "einmalige Abrechnung";
  }

  return "Abrechnung im Store";
};

const formatPackageTitle = (aPackage: PurchasesPackage): string => {
  if (aPackage.packageType === PACKAGE_TYPE.MONTHLY) {
    return "Monthly";
  }

  if (aPackage.packageType === PACKAGE_TYPE.ANNUAL) {
    return "Yearly";
  }

  if (aPackage.packageType === PACKAGE_TYPE.LIFETIME) {
    return "Lifetime";
  }

  return aPackage.product.title;
};

const formatPackagePrice = (aPackage: PurchasesPackage): string => {
  if (aPackage.packageType === PACKAGE_TYPE.MONTHLY) {
    return `${aPackage.product.priceString}/Monat`;
  }

  if (aPackage.packageType === PACKAGE_TYPE.ANNUAL) {
    return `${aPackage.product.priceString}/Jahr`;
  }

  return aPackage.product.priceString;
};

const getPackageBadge = (aPackage: PurchasesPackage): string | undefined => {
  if (aPackage.packageType === PACKAGE_TYPE.ANNUAL) {
    return "Beliebt";
  }

  return undefined;
};

const resolvePlanFromPackage = (
  aPackage: PurchasesPackage,
): RevenueCatPlanT | null => {
  if (aPackage.packageType === PACKAGE_TYPE.MONTHLY) {
    return "monthly";
  }

  if (aPackage.packageType === PACKAGE_TYPE.ANNUAL) {
    return "yearly";
  }

  if (aPackage.packageType === PACKAGE_TYPE.LIFETIME) {
    return "lifetime";
  }

  return null;
};

const mapOfferingToPackageOptions = (
  offering: PurchasesOffering,
): RevenueCatPackageOptionT[] => {
  const packages = [
    offering.monthly,
    offering.annual,
    offering.lifetime,
  ].filter((value): value is PurchasesPackage => Boolean(value));

  const packageOptions: RevenueCatPackageOptionT[] = [];

  packages.forEach((aPackage) => {
    const plan = resolvePlanFromPackage(aPackage);

    if (!plan) {
      return;
    }

    packageOptions.push({
      plan,
      title: formatPackageTitle(aPackage),
      priceText: formatPackagePrice(aPackage),
      description: formatPackageDescription(aPackage),
      badge: getPackageBadge(aPackage),
      packageToPurchase: aPackage,
    });
  });

  return packageOptions;
};

const isPurchaseCancelledError = (error: PurchasesError): boolean =>
  error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
  error.userCancelled === true;

const isPendingPurchaseError = (error: PurchasesError): boolean =>
  error.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR;

export const hasActiveRevenueCatAccess = (
  customerInfo: CustomerInfo,
): boolean =>
  Object.keys(customerInfo.entitlements.active).length > 0 ||
  customerInfo.activeSubscriptions.length > 0;

export const getRevenueCatAvailability =
  (): RevenueCatInitializationResultT => {
    if (!isSupportedPlatform()) {
      return { status: "unsupported" };
    }

    if (!getApiKeyForCurrentPlatform()) {
      return { status: "missing_api_key" };
    }

    return { status: "ready" };
  };

export const initializeRevenueCatForUser = async (
  appUserId: string,
): Promise<RevenueCatInitializationResultT> => {
  const availability = getRevenueCatAvailability();

  if (availability.status !== "ready") {
    return availability;
  }

  const apiKey = getApiKeyForCurrentPlatform();
  if (!apiKey) {
    return { status: "missing_api_key" };
  }

  await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);

  if (!hasConfiguredPurchases) {
    Purchases.configure({
      apiKey,
      appUserID: appUserId,
    });
    Purchases.addCustomerInfoUpdateListener(customerInfoUpdateListener);
    hasConfiguredPurchases = true;
    initializedAppUserId = appUserId;
    return { status: "ready" };
  }

  if (initializedAppUserId === appUserId) {
    return { status: "ready" };
  }

  await Purchases.logIn(appUserId);
  initializedAppUserId = appUserId;
  return { status: "ready" };
};

export const getCurrentRevenueCatOffering =
  async (): Promise<PurchasesOffering | null> => {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  };

export const getRevenueCatPackageOptions = async (): Promise<
  RevenueCatPackageOptionT[]
> => {
  const offering = await getCurrentRevenueCatOffering();

  if (!offering) {
    return [];
  }

  return mapOfferingToPackageOptions(offering);
};

export const purchaseRevenueCatPackage = async (
  aPackage: PurchasesPackage,
): Promise<RevenueCatPurchaseResultT> => {
  try {
    const result = await Purchases.purchasePackage(aPackage);
    notifyAccessStateChanged();

    return {
      status: "purchased",
      customerInfo: result.customerInfo,
      productIdentifier: result.productIdentifier,
    };
  } catch (error) {
    const purchasesError = error as PurchasesError;

    if (isPurchaseCancelledError(purchasesError)) {
      return {
        status: "cancelled",
        message: "Der Kauf wurde abgebrochen.",
      };
    }

    if (isPendingPurchaseError(purchasesError)) {
      return {
        status: "pending",
        message: "Der Kauf ist noch ausstehend und wird vom Store verarbeitet.",
      };
    }

    throw error;
  }
};

export const restoreRevenueCatPurchases =
  async (): Promise<RevenueCatRestoreResultT> => {
    const customerInfo = await Purchases.restorePurchases();
    notifyAccessStateChanged();

    return { customerInfo };
  };
