import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { multiSessionClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { env } from "@suwa/env/native";

function isWeb(): boolean {
  return Platform.OS === "web";
}

const storage = isWeb()
  ? {
      getItem: async (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {}
      },
      removeItem: async (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {}
      },
    }
  : {
      getItem: SecureStore.getItemAsync,
      setItem: SecureStore.setItemAsync,
      removeItem: SecureStore.deleteItemAsync,
    };

const isWebPlatform = isWeb();

const plugins = [multiSessionClient()];

if (!isWebPlatform) {
  plugins.push(
    expoClient({
      scheme: "suwa",
      storage,
    })
  );
}


const fetchOptions = isWebPlatform
  ? { credentials: "include" as const }
  : undefined;

export const authClient = createAuthClient({
  baseURL: env.EXPO_PUBLIC_SERVER_URL,
  fetchOptions,
  plugins,
});
