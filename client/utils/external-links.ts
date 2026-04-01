import { Alert, Linking, Platform } from "react-native";

export const PRIVACY_URL = "https://www.thelukeapp.com/privacy";
export const TERMS_URL = "https://www.thelukeapp.com/terms";
const IOS_SUBSCRIPTIONS_URL = "https://apps.apple.com/account/subscriptions";
const ANDROID_SUBSCRIPTIONS_URL =
  "https://play.google.com/store/account/subscriptions";

/**
 * Opens an external URL in the system browser and shows a fallback alert on failure.
 */
export const openExternalUrl = async (url: string) => {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert("Link konnte nicht geöffnet werden");
      return;
    }

    await Linking.openURL(url);
  } catch (error) {
    console.error("Failed to open external URL:", error);
    Alert.alert(
      "Link konnte nicht geöffnet werden",
      "Bitte versuche es erneut.",
    );
  }
};

/**
 * Opens the platform-specific subscription management page.
 */
export const openSubscriptionManagement = async () => {
  if (Platform.OS === "ios") {
    await openExternalUrl(IOS_SUBSCRIPTIONS_URL);
    return;
  }

  if (Platform.OS === "android") {
    await openExternalUrl(ANDROID_SUBSCRIPTIONS_URL);
    return;
  }

  Alert.alert(
    "Aboverwaltung nicht verfügbar",
    "Die Aboverwaltung ist auf diesem Gerät nicht verfügbar.",
  );
};
