import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// TODO: Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your env.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "";

const secureStoreAvailablePromise =
  Platform.OS === "web" || typeof SecureStore.isAvailableAsync !== "function"
    ? Promise.resolve(false)
    : SecureStore.isAvailableAsync();

const StorageAdapter = {
  getItem: async (key: string) => {
    if (await secureStoreAvailablePromise) {
      return SecureStore.getItemAsync(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (await secureStoreAvailablePromise) {
      return SecureStore.setItemAsync(key, value);
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (await secureStoreAvailablePromise) {
      return SecureStore.deleteItemAsync(key);
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: StorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
