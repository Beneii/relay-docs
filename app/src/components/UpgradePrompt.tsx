import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme, spacing, fontSizes, radii } from "@/theme";

interface UpgradePromptProps {
  title?: string;
  message: string;
  compact?: boolean;
}

export function UpgradePrompt({
  title = "Plan limits",
  message,
  compact = false,
}: UpgradePromptProps) {
  const { colors } = useTheme();

  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer,
          { backgroundColor: colors.accentSubtle, borderColor: colors.accent + "30" },
        ]}
      >
        <Feather name="info" size={16} color={colors.accent} />
        <Text
          style={[styles.compactText, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {message}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View
        style={[styles.iconCircle, { backgroundColor: colors.accentSubtle }]}
      >
        <Feather name="info" size={22} color={colors.accent} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
      <View
        style={[
          styles.noticeBox,
          { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
          Plan changes are not available in the mobile app right now.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: "700",
  },
  message: {
    fontSize: fontSizes.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  noticeBox: {
    width: "100%",
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  noticeText: {
    fontSize: fontSizes.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  compactText: {
    fontSize: fontSizes.sm,
    fontWeight: "500",
    flex: 1,
  },
});
