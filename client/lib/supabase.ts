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

const IS_WEB = Platform.OS === "web";
const SECURE_STORE_CHUNK_SIZE = 1800;
const SECURE_STORE_META_SUFFIX = "__meta";
const SECURE_STORE_CHUNK_PREFIX = "__chunk__";
const inMemoryNativeAuthStorage = new Map<string, string>();

const getSecureStoreMetaKey = (key: string) =>
  `${key}${SECURE_STORE_META_SUFFIX}`;

const getSecureStoreChunkKey = (key: string, index: number) =>
  `${key}${SECURE_STORE_CHUNK_PREFIX}${index}`;

const deleteSecureStoreChunks = async (key: string): Promise<void> => {
  const metaKey = getSecureStoreMetaKey(key);
  const chunkCountValue = await SecureStore.getItemAsync(metaKey);
  const chunkCount = Number(chunkCountValue);

  await SecureStore.deleteItemAsync(key);
  await SecureStore.deleteItemAsync(metaKey);

  if (Number.isFinite(chunkCount) && chunkCount > 0) {
    await Promise.all(
      Array.from({ length: chunkCount }, (_, index) =>
        SecureStore.deleteItemAsync(getSecureStoreChunkKey(key, index)),
      ),
    );
  }
};

const readFromSecureStore = async (key: string): Promise<string | null> => {
  const directValue = await SecureStore.getItemAsync(key);
  if (directValue !== null && directValue !== undefined) {
    return directValue;
  }

  const metaValue = await SecureStore.getItemAsync(getSecureStoreMetaKey(key));
  const chunkCount = Number(metaValue);

  if (!Number.isFinite(chunkCount) || chunkCount <= 0) {
    return null;
  }

  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) =>
      SecureStore.getItemAsync(getSecureStoreChunkKey(key, index)),
    ),
  );

  if (chunks.some((chunk) => chunk === null || chunk === undefined)) {
    return null;
  }

  return chunks.join("");
};

const writeToSecureStore = async (
  key: string,
  value: string,
): Promise<void> => {
  await deleteSecureStoreChunks(key);

  if (value.length <= SECURE_STORE_CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const chunkCount = Math.ceil(value.length / SECURE_STORE_CHUNK_SIZE);
  const chunkWrites = Array.from({ length: chunkCount }, (_, index) => {
    const startIndex = index * SECURE_STORE_CHUNK_SIZE;
    const chunk = value.slice(startIndex, startIndex + SECURE_STORE_CHUNK_SIZE);

    return SecureStore.setItemAsync(getSecureStoreChunkKey(key, index), chunk);
  });

  await Promise.all(chunkWrites);
  await SecureStore.setItemAsync(
    getSecureStoreMetaKey(key),
    String(chunkCount),
  );
};

const StorageAdapter = {
  getItem: async (key: string) => {
    if (IS_WEB) {
      return AsyncStorage.getItem(key);
    }

    if (await secureStoreAvailablePromise) {
      const secureValue = await readFromSecureStore(key);
      if (secureValue !== null && secureValue !== undefined) {
        return secureValue;
      }

      const legacyAsyncStorageValue = await AsyncStorage.getItem(key);
      if (
        legacyAsyncStorageValue !== null &&
        legacyAsyncStorageValue !== undefined
      ) {
        await writeToSecureStore(key, legacyAsyncStorageValue);
        await AsyncStorage.removeItem(key);
        return legacyAsyncStorageValue;
      }

      return null;
    }

    return inMemoryNativeAuthStorage.get(key) ?? null;
  },
  setItem: async (key: string, value: string) => {
    if (IS_WEB) {
      return AsyncStorage.setItem(key, value);
    }

    if (await secureStoreAvailablePromise) {
      await writeToSecureStore(key, value);
      await AsyncStorage.removeItem(key);
      return;
    }

    inMemoryNativeAuthStorage.set(key, value);
    await AsyncStorage.removeItem(key);
  },
  removeItem: async (key: string) => {
    if (IS_WEB) {
      return AsyncStorage.removeItem(key);
    }

    if (await secureStoreAvailablePromise) {
      await deleteSecureStoreChunks(key);
    }

    inMemoryNativeAuthStorage.delete(key);
    await AsyncStorage.removeItem(key);
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
