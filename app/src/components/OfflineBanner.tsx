import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNetInfo } from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme, spacing, fontSizes } from "@/theme";

export function OfflineBanner() {
  const { isConnected } = useNetInfo();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // null means unknown (still checking), only show when definitively offline
  if (isConnected !== false) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.warningSubtle,
          paddingTop: Math.max(insets.top, spacing.xs),
        },
      ]}
    >
      <Feather name="wifi-off" size={14} color={colors.warning} />
      <Text style={[styles.text, { color: colors.warning }]}>
        No internet connection
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  text: {
    fontSize: fontSizes.sm,
    fontWeight: "500",
  },
});
