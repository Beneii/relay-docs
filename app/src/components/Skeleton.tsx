import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme, spacing, radii } from "@/theme";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonBox({ width, height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <SkeletonBox width={48} height={48} borderRadius={radii.md} />
      <View style={styles.cardContent}>
        <SkeletonBox width={140} height={16} />
        <SkeletonBox width={100} height={12} style={{ marginTop: 6 }} />
        <SkeletonBox width={180} height={12} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function SkeletonNotification() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.notifCard,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
      ]}
    >
      <View style={styles.notifHeader}>
        <SkeletonBox width={200} height={16} />
        <SkeletonBox width={40} height={12} />
      </View>
      <SkeletonBox width="90%" height={14} style={{ marginTop: 6 }} />
      <View style={styles.notifMeta}>
        <SkeletonBox width={60} height={12} />
        <SkeletonBox width={50} height={16} borderRadius={4} />
      </View>
    </View>
  );
}

export function DashboardSkeletonList() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

export function NotificationSkeletonList() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <SkeletonNotification key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  notifCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notifMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
});
