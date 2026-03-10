import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";
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
  customIconUrl?: string | null;
  backgroundColor?: string | null;
  size?: number;
}

export function AppIcon({
  icon,
  accentColor,
  customIconUrl,
  backgroundColor,
  size = 44,
}: AppIconProps) {
  const bg = backgroundColor ?? (accentColor ? accentColor + "20" : "#10B98120");
  const borderRadius = size * 0.22;

  if (customIconUrl) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius, backgroundColor: bg }]}>
        <Image
          source={{ uri: customIconUrl }}
          style={{ width: size * 0.75, height: size * 0.75, borderRadius: borderRadius * 0.5 }}
          resizeMode="contain"
          // Fallback rendered via onError — show first letter of icon key
        />
      </View>
    );
  }

  const iconName = ((icon && ICON_OPTIONS[icon]) || "globe") as keyof typeof Feather.glyphMap;
  const accent = accentColor ?? "#10B981";

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius, backgroundColor: bg }]}>
      <Feather name={iconName} size={size * 0.45} color={accent} />
    </View>
  );
}

// Fallback letter avatar when custom icon URL fails to load
export function AppIconFallback({
  name,
  accentColor,
  backgroundColor,
  size = 44,
}: {
  name: string;
  accentColor: string | null;
  backgroundColor?: string | null;
  size?: number;
}) {
  const bg = backgroundColor ?? (accentColor ? accentColor + "20" : "#10B98120");
  const accent = accentColor ?? "#10B981";
  const letter = (name || "?")[0].toUpperCase();

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.22, backgroundColor: bg }]}>
      <Text style={{ color: accent, fontSize: size * 0.4, fontWeight: "700" }}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
