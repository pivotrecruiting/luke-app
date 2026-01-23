import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEY } from "@/context/app/constants";
import type { PersistedData } from "@/context/app/types";

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
