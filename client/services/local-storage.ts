import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { STORAGE_KEY } from "@/context/app/constants";
import type { PersistedData } from "@/context/app/types";

const PENDING_WORKSHOP_CODE_STORAGE_KEY = "luke_pending_workshop_code";

const secureStoreAvailablePromise =
  Platform.OS === "web" || typeof SecureStore.isAvailableAsync !== "function"
    ? Promise.resolve(false)
    : SecureStore.isAvailableAsync();

export type PendingWorkshopCodeT = {
  code: string;
  signupMethod?: "email" | "google" | "apple" | "unknown";
};

export const loadPersistedData = async (): Promise<PersistedData | null> => {
  const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
  if (!jsonValue) return null;
  return JSON.parse(jsonValue) as PersistedData;
};

export const savePersistedData = async (data: PersistedData): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const clearPersistedData = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};

export const loadPendingWorkshopCode =
  async (): Promise<PendingWorkshopCodeT | null> => {
    if (await secureStoreAvailablePromise) {
      try {
        const secureValue = await SecureStore.getItemAsync(
          PENDING_WORKSHOP_CODE_STORAGE_KEY,
        );

        if (secureValue) {
          return JSON.parse(secureValue) as PendingWorkshopCodeT;
        }
      } catch (error) {
        console.error("Failed to read pending workshop code:", error);
      }
    }

    const jsonValue = await AsyncStorage.getItem(
      PENDING_WORKSHOP_CODE_STORAGE_KEY,
    );
    if (!jsonValue) return null;
    return JSON.parse(jsonValue) as PendingWorkshopCodeT;
  };

export const savePendingWorkshopCode = async (
  pendingWorkshopCode: PendingWorkshopCodeT,
): Promise<void> => {
  const serializedValue = JSON.stringify(pendingWorkshopCode);

  if (await secureStoreAvailablePromise) {
    try {
      await SecureStore.setItemAsync(
        PENDING_WORKSHOP_CODE_STORAGE_KEY,
        serializedValue,
      );
    } catch (error) {
      console.error("Failed to store pending workshop code:", error);
      await AsyncStorage.setItem(
        PENDING_WORKSHOP_CODE_STORAGE_KEY,
        serializedValue,
      );
      return;
    }

    await AsyncStorage.removeItem(PENDING_WORKSHOP_CODE_STORAGE_KEY);
    return;
  }

  await AsyncStorage.setItem(
    PENDING_WORKSHOP_CODE_STORAGE_KEY,
    serializedValue,
  );
};

export const clearPendingWorkshopCode = async (): Promise<void> => {
  if (await secureStoreAvailablePromise) {
    try {
      await SecureStore.deleteItemAsync(PENDING_WORKSHOP_CODE_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear pending workshop code:", error);
    }
  }

  await AsyncStorage.removeItem(PENDING_WORKSHOP_CODE_STORAGE_KEY);
};
