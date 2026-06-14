'use client';

import {
  AESEncryptionKey,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
} from "expo-crypto";
import { getItemAsync, setItemAsync } from "expo-secure-store";
import { Platform } from "react-native";

const SECRET_STORAGE_KEY = "user_crypto_secret";

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function generateUserSecret(): string {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return uint8ArrayToBase64(key);
}

async function getEncryptionKey(
  secretBase64: string
): Promise<AESEncryptionKey> {
  const keyBytes = base64ToUint8Array(secretBase64);
  return AESEncryptionKey.import(keyBytes);
}

export async function encryptData(
  data: Record<string, unknown>,
  secretBase64: string
): Promise<string> {
  const key = await getEncryptionKey(secretBase64);
  const plaintext = uint8ArrayToBase64(
    new TextEncoder().encode(JSON.stringify(data))
  );

  const sealed = await aesEncryptAsync(plaintext, key, {
    nonce: { length: 12 },
    tagLength: 16,
  });

  const combined = await sealed.combined();

  return uint8ArrayToBase64(combined);
}

export async function decryptData(
  encryptedBase64: string,
  secretBase64: string
): Promise<Record<string, unknown> | null> {
  try {
    const key = await getEncryptionKey(secretBase64);
    const combined = base64ToUint8Array(encryptedBase64);

    const sealed = AESSealedData.fromCombined(combined, {
      ivLength: 12,
      tagLength: 16,
    });
    const decrypted = await aesDecryptAsync(sealed, key, { output: "base64" });

    const decoded = new TextDecoder().decode(
      base64ToUint8Array(decrypted as string)
    );
    const parsed = JSON.parse(decoded);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

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
