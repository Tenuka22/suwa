"use client";

import { getItemAsync, setItemAsync } from "expo-secure-store";
import { Platform } from "react-native";

// biome-ignore lint/performance/noBarrelFile: compatibility re-exports for existing consumers
export {
  decryptUserData as decryptData,
  encryptUserData as encryptData,
  generateUserSecret,
} from "@suwa/crypto/native";

const SECRET_STORAGE_KEY = "user_crypto_secret";

function isWeb(): boolean {
  return Platform.OS === "web";
}

export async function storeSecret(secret: string): Promise<void> {
  if (isWeb()) {
    sessionStorage.setItem(SECRET_STORAGE_KEY, secret);
    return;
  }
  await setItemAsync(SECRET_STORAGE_KEY, secret);
}

export async function getStoredSecret(): Promise<string | null> {
  if (isWeb()) {
    return sessionStorage.getItem(SECRET_STORAGE_KEY);
  }
  try {
    return await getItemAsync(SECRET_STORAGE_KEY);
  } catch {
    return null;
  }
}
