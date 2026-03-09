import { useColorScheme } from "react-native";
import { colors, type ColorScheme, type ThemeColors } from "./tokens";
import { useSettingsStore } from "@/stores/settingsStore";

export function useTheme(): { colors: ThemeColors; scheme: ColorScheme } {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);

  const scheme: ColorScheme =
    themeMode === "system"
      ? systemScheme === "light"
        ? "light"
        : "dark"
      : themeMode;

  return {
    colors: colors[scheme],
    scheme,
  };
}
