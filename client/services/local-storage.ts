import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEY } from "@/context/app/constants";
import type { PersistedData } from "@/context/app/types";

const PENDING_WORKSHOP_CODE_STORAGE_KEY = `${STORAGE_KEY}:pending_workshop_code`;

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
    const jsonValue = await AsyncStorage.getItem(
      PENDING_WORKSHOP_CODE_STORAGE_KEY,
    );
    if (!jsonValue) return null;
    return JSON.parse(jsonValue) as PendingWorkshopCodeT;
  };

export const savePendingWorkshopCode = async (
  pendingWorkshopCode: PendingWorkshopCodeT,
): Promise<void> => {
  await AsyncStorage.setItem(
    PENDING_WORKSHOP_CODE_STORAGE_KEY,
    JSON.stringify(pendingWorkshopCode),
  );
};

export const clearPendingWorkshopCode = async (): Promise<void> => {
  await AsyncStorage.removeItem(PENDING_WORKSHOP_CODE_STORAGE_KEY);
};
