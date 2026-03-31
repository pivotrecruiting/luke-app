import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { NotificationResponse } from "expo-notifications";
import {
  deactivateMyPushToken,
  fetchMyNotificationSettings,
  registerMyPushToken,
  updateMyNotificationSettings,
} from "@/services/notification-settings-service";

const PUSH_TOKEN_STORAGE_KEY = "luke_push_notification_token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type PushPermissionStatusT =
  | "granted"
  | "denied"
  | "undetermined"
  | "unsupported";

export type PushPermissionSnapshotT = {
  status: PushPermissionStatusT;
  canAskAgain: boolean;
  granted: boolean;
};

const getExpoProjectId = (): string | null => {
  const projectIdFromExpoConfig =
    Constants.expoConfig?.extra?.eas?.projectId ?? null;
  const projectIdFromEasConfig = Constants.easConfig?.projectId ?? null;

  return projectIdFromExpoConfig || projectIdFromEasConfig || null;
};

const ensureAndroidNotificationChannel = async (): Promise<void> => {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
};

const getStoredPushToken = async (): Promise<string | null> => {
  if (typeof SecureStore.getItemAsync !== "function") {
    return null;
  }

  try {
    return await SecureStore.getItemAsync(PUSH_TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to read stored push token:", error);
    return null;
  }
};

const saveStoredPushToken = async (token: string): Promise<void> => {
  if (typeof SecureStore.setItemAsync !== "function") {
    return;
  }

  try {
    await SecureStore.setItemAsync(PUSH_TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.error("Failed to store push token:", error);
  }
};

const clearStoredPushToken = async (): Promise<void> => {
  if (typeof SecureStore.deleteItemAsync !== "function") {
    return;
  }

  try {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear stored push token:", error);
  }
};

export const getDeviceTimezone = (): string | null => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return typeof timezone === "string" && timezone.trim() ? timezone : null;
};

export const getPushPermissionSnapshot =
  async (): Promise<PushPermissionSnapshotT> => {
    if (Platform.OS === "web") {
      return {
        status: "unsupported",
        canAskAgain: false,
        granted: false,
      };
    }

    const permissions = await Notifications.getPermissionsAsync();
    const granted =
      permissions.granted ||
      permissions.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL;

    return {
      status: granted
        ? "granted"
        : permissions.canAskAgain
          ? "undetermined"
          : "denied",
      canAskAgain: permissions.canAskAgain,
      granted,
    };
  };

const ensureNotificationSettingsTimezone = async (): Promise<void> => {
  const deviceTimezone = getDeviceTimezone();

  if (!deviceTimezone) {
    return;
  }

  const currentSettings = await fetchMyNotificationSettings();

  if (currentSettings.timezone === deviceTimezone) {
    return;
  }

  await updateMyNotificationSettings({
    ...currentSettings,
    timezone: deviceTimezone,
  });
};

const getPushTokenPayload = async (): Promise<{
  token: string;
  platform: "ios" | "android";
}> => {
  const projectId = getExpoProjectId();

  if (!projectId) {
    throw new Error("Missing Expo EAS project ID for push token registration.");
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return {
    token: tokenResponse.data,
    platform: Platform.OS === "ios" ? "ios" : "android",
  };
};

export const requestPushPermissionsAndRegisterToken =
  async (): Promise<PushPermissionSnapshotT> => {
    if (Platform.OS === "web") {
      return {
        status: "unsupported",
        canAskAgain: false,
        granted: false,
      };
    }

    const existingPermissions = await Notifications.getPermissionsAsync();
    let granted =
      existingPermissions.granted ||
      existingPermissions.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL;
    let canAskAgain = existingPermissions.canAskAgain;

    if (!granted) {
      const requestedPermissions =
        await Notifications.requestPermissionsAsync();

      granted =
        requestedPermissions.granted ||
        requestedPermissions.ios?.status ===
          Notifications.IosAuthorizationStatus.PROVISIONAL;
      canAskAgain = requestedPermissions.canAskAgain;
    }

    if (!granted) {
      return {
        status: canAskAgain ? "undetermined" : "denied",
        canAskAgain,
        granted: false,
      };
    }

    await ensureAndroidNotificationChannel();
    await ensureNotificationSettingsTimezone();

    const pushTokenPayload = await getPushTokenPayload();

    await registerMyPushToken({
      provider: "expo",
      token: pushTokenPayload.token,
      platform: pushTokenPayload.platform,
      appBuild:
        Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? null,
    });

    await saveStoredPushToken(pushTokenPayload.token);

    return {
      status: "granted",
      canAskAgain,
      granted: true,
    };
  };

export const syncPushTokenForCurrentUser = async (): Promise<void> => {
  if (Platform.OS === "web") {
    return;
  }

  const settings = await fetchMyNotificationSettings();
  const deviceTimezone = getDeviceTimezone();

  if (deviceTimezone && settings.timezone !== deviceTimezone) {
    await updateMyNotificationSettings({
      ...settings,
      timezone: deviceTimezone,
    });
  }

  if (!settings.pushNotificationsEnabled) {
    await deactivateStoredPushToken();
    return;
  }

  const permissionSnapshot = await getPushPermissionSnapshot();

  if (!permissionSnapshot.granted) {
    return;
  }

  await ensureAndroidNotificationChannel();
  const pushTokenPayload = await getPushTokenPayload();

  await registerMyPushToken({
    provider: "expo",
    token: pushTokenPayload.token,
    platform: pushTokenPayload.platform,
    appBuild:
      Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? null,
  });

  await saveStoredPushToken(pushTokenPayload.token);
};

export const deactivateStoredPushToken = async (): Promise<void> => {
  const token = await getStoredPushToken();

  if (!token) {
    return;
  }

  try {
    await deactivateMyPushToken(token);
  } finally {
    await clearStoredPushToken();
  }
};

export const extractDeepLinkFromNotificationResponse = (
  response: NotificationResponse | null,
): string | null => {
  const data = response?.notification.request.content.data;

  if (!data || typeof data !== "object") {
    return null;
  }

  const deepLink =
    "deeplink" in data && typeof data.deeplink === "string"
      ? data.deeplink
      : "url" in data && typeof data.url === "string"
        ? data.url
        : null;

  return deepLink && deepLink.trim() ? deepLink : null;
};

export const getLastNotificationResponseDeepLink = async (): Promise<
  string | null
> => {
  const response = await Notifications.getLastNotificationResponseAsync();

  return extractDeepLinkFromNotificationResponse(response);
};

export const subscribeToNotificationResponses = (
  onDeepLink: (deepLink: string) => void,
): (() => void) => {
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const deepLink = extractDeepLinkFromNotificationResponse(response);

      if (deepLink) {
        onDeepLink(deepLink);
      }
    });

  const pushTokenSubscription =
    typeof Notifications.addPushTokenListener === "function"
      ? Notifications.addPushTokenListener((token) => {
          void registerMyPushToken({
            provider: "expo",
            token: token.data,
            platform: Platform.OS === "ios" ? "ios" : "android",
            appBuild:
              Constants.expoConfig?.version ??
              Constants.nativeAppVersion ??
              null,
          })
            .then(() => saveStoredPushToken(token.data))
            .catch((error) => {
              console.error("Failed to sync refreshed push token:", error);
            });
        })
      : null;

  return () => {
    responseSubscription.remove();
    pushTokenSubscription?.remove();
  };
};
