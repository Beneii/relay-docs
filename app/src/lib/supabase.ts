import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
const FALLBACK_URL = "https://placeholder.supabase.co";
const FALLBACK_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.placeholder";

function isConfiguredString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    !value.includes("YOUR_") &&
    !value.includes("placeholder")
  );
}

function resolveConfigValue(
  configValue: unknown,
  envValue: string | undefined,
  fallback: string
): string {
  if (isConfiguredString(configValue)) {
    return configValue;
  }
  if (isConfiguredString(envValue)) {
    return envValue;
  }
  return fallback;
}

const supabaseUrl = resolveConfigValue(
  Constants.expoConfig?.extra?.supabaseUrl,
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  FALLBACK_URL
);
const supabaseAnonKey = resolveConfigValue(
  Constants.expoConfig?.extra?.supabaseAnonKey,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  FALLBACK_KEY
);

if (supabaseUrl === FALLBACK_URL || supabaseAnonKey === FALLBACK_KEY) {
  console.warn(
    "Supabase not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment."
  );
}

// SecureStore for native, localStorage for web (dev only)
const storageAdapter =
  Platform.OS === "web"
    ? {
        getItem: (key: string): Promise<string | null> => {
          if (typeof localStorage !== "undefined") {
            return Promise.resolve(localStorage.getItem(key));
          }
          return Promise.resolve(null);
        },
        setItem: (key: string, value: string): Promise<void> => {
          if (typeof localStorage !== "undefined") {
            localStorage.setItem(key, value);
          }
          return Promise.resolve();
        },
        removeItem: (key: string): Promise<void> => {
          if (typeof localStorage !== "undefined") {
            localStorage.removeItem(key);
          }
          return Promise.resolve();
        },
      }
    : (() => {
        const SecureStore = require("expo-secure-store");
        const CHUNK_SIZE = 2000; // Stay under SecureStore's 2048 byte limit

        return {
          getItem: async (key: string): Promise<string | null> => {
            const raw = await SecureStore.getItemAsync(key);
            if (raw !== null) return raw;
            // Try reading chunked value
            const chunk0 = await SecureStore.getItemAsync(`${key}_chunk_0`);
            if (chunk0 === null) return null;
            const parts = [chunk0];
            let i = 1;
            while (true) {
              const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
              if (chunk === null) break;
              parts.push(chunk);
              i++;
            }
            return parts.join("");
          },
          setItem: async (key: string, value: string): Promise<void> => {
            if (value.length <= CHUNK_SIZE) {
              await SecureStore.setItemAsync(key, value);
              // Clean up any old chunks
              await SecureStore.deleteItemAsync(`${key}_chunk_0`).catch(() => {});
              return;
            }
            // Store in chunks
            const chunks = Math.ceil(value.length / CHUNK_SIZE);
            for (let i = 0; i < chunks; i++) {
              await SecureStore.setItemAsync(
                `${key}_chunk_${i}`,
                value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
              );
            }
            // Remove old extra chunks and the non-chunked key
            await SecureStore.deleteItemAsync(key).catch(() => {});
            let j = chunks;
            while (true) {
              try {
                const old = await SecureStore.getItemAsync(`${key}_chunk_${j}`);
                if (old === null) break;
                await SecureStore.deleteItemAsync(`${key}_chunk_${j}`);
                j++;
              } catch {
                break;
              }
            }
          },
          removeItem: async (key: string): Promise<void> => {
            await SecureStore.deleteItemAsync(key).catch(() => {});
            // Clean up chunks
            let i = 0;
            while (true) {
              try {
                const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
                if (chunk === null) break;
                await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
                i++;
              } catch {
                break;
              }
            }
          },
        };
      })();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});
