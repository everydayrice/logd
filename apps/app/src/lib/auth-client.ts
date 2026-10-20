import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://logd.ricecloud.workers.dev";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    expoClient({
      scheme: "logd",
      storagePrefix: "logd",
      storage: SecureStore,
    }),
  ],
});
