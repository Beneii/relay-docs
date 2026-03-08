import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

const ICON_OPTIONS: Record<string, keyof typeof Feather.glyphMap> = {
  globe: "globe",
  server: "server",
  bot: "cpu",
  chart: "bar-chart-2",
  tool: "tool",
  shield: "shield",
  bolt: "zap",
  code: "code",
  database: "database",
  bell: "bell",
  rocket: "send",
  gear: "settings",
};

export const ICON_KEYS = Object.keys(ICON_OPTIONS);

interface AppIconProps {
  icon: string | null;
  accentColor: string | null;
  size?: number;
}

export function AppIcon({ icon, accentColor, size = 44 }: AppIconProps) {
  const iconName = ((icon && ICON_OPTIONS[icon]) || "globe") as keyof typeof Feather.glyphMap;
  const bg = accentColor ?? "#10B981";

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.22,
          backgroundColor: bg + "20",
        },
      ]}
    >
      <Feather name={iconName} size={size * 0.45} color={bg} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
