import { create } from "zustand";
import { Platform } from "react-native";
import type { ThemeMode } from "@/theme/tokens";

const THEME_KEY = "relay_theme_mode";

async function getStoredValue(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  }
  const SecureStore = require("expo-secure-store");
  return SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    return;
  }
  const SecureStore = require("expo-secure-store");
  return SecureStore.setItemAsync(key, value);
}

interface SettingsState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  themeMode: "system",
  setThemeMode: (mode) => {
    set({ themeMode: mode });
    setStoredValue(THEME_KEY, mode).catch(console.error);
  },
  loadSettings: async () => {
    try {
      const stored = await getStoredValue(THEME_KEY);
      if (stored === "dark" || stored === "light" || stored === "system") {
        set({ themeMode: stored });
      }
    } catch {
      // Use default
    }
  },
}));
