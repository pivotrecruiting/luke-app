import { Alert, Linking } from "react-native";

export const PRIVACY_URL = "https://www.thelukeapp.com/privacy";
export const TERMS_URL = "https://www.thelukeapp.com/terms";

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
