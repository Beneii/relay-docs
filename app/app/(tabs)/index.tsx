import React, { useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useApps, useDeleteApp } from "@/hooks/useApps";
import {
  useLatestNotificationByApp,
} from "@/hooks/useNotifications";
import { useProfile } from "@/hooks/useProfile";
import { AppIcon } from "@/components/AppIcon";
import { EmptyState } from "@/components/EmptyState";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { DashboardSkeletonList } from "@/components/Skeleton";
import { PressableScale } from "@/components/PressableScale";
import { extractHostname } from "@/utils/url";
import { timeAgo } from "@/utils/time";
import { Feather } from "@expo/vector-icons";
import { FREE_LIMITS } from "@shared/product";
import { RelayLogo } from "@/components/RelayLogo";
import { useTheme, spacing, fontSizes, radii } from "@/theme";
import type { AccessibleAppRow } from "@/types/database";

function AppCard({ app, index }: { app: AccessibleAppRow; index: number }) {
  const { colors } = useTheme();
  const latestNotifications = useLatestNotificationByApp();
  const deleteApp = useDeleteApp();
  const latestNotification = latestNotifications.get(app.id);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = Math.min(index * 60, 300);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  function handlePress() {
    router.push({ pathname: "/app/[id]", params: { id: app.id } });
  }

  function handleLongPress() {
    if (!app.is_owner) {
      return;
    }

    Alert.alert(app.name, undefined, [
      {
        text: "Edit",
        onPress: () =>
          router.push({ pathname: "/edit-app", params: { id: app.id } }),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Delete App",
            `Are you sure you want to delete "${app.name}"?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  deleteApp.mutate(app.id, {
                    onError: (err: unknown) => {
                      const message = err instanceof Error ? err.message : "Failed to delete app";
                      Alert.alert("Error", message);
                    },
                  });
                },
              },
            ]
          );
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <PressableScale
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={handlePress}
        onLongPress={app.is_owner ? handleLongPress : undefined}
        android_ripple={{ color: colors.accentSubtle }}
      >
        <AppIcon icon={app.icon} accentColor={app.accent_color} customIconUrl={app.custom_icon_url} backgroundColor={app.background_color} size={48} />
        <View style={styles.cardContent}>
          <Text
            style={[styles.cardName, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {app.custom_app_name || app.name}
          </Text>
          <Text
            style={[styles.cardHost, { color: colors.textTertiary }]}
            numberOfLines={1}
          >
            {extractHostname(app.url)}
          </Text>
          {latestNotification ? (
            <View style={styles.notifRow}>
              <View style={[styles.notifDot, { backgroundColor: colors.accent }]} />
              <Text
                style={[styles.cardNotif, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {latestNotification.title} · {timeAgo(latestNotification.created_at)}
              </Text>
            </View>
          ) : null}
        </View>
        <Feather name="chevron-right" size={16} color={colors.textTertiary} />
      </PressableScale>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { data: apps, isLoading, isFetching, error, refetch } = useApps();
  const { data: profile } = useProfile();

  const plan = profile?.plan ?? "free";
  const appCount = apps?.length ?? 0;
  const ownedAppCount = apps?.filter((app) => app.is_owner).length ?? 0;
  const atLimit = plan === "free" && ownedAppCount >= FREE_LIMITS.dashboards;

  const renderItem = useCallback(
    ({ item, index }: { item: AccessibleAppRow; index: number }) => (
      <AppCard app={item} index={index} />
    ),
    []
  );

  function handleAdd() {
    if (atLimit) {
      Alert.alert(
        "Dashboard limit reached",
        `Free accounts are limited to ${FREE_LIMITS.dashboards} dashboards in the mobile app right now.`,
        [{ text: "OK" }]
      );
      return;
    }
    router.push("/edit-app");
  }

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.brandHeader}>
          <RelayLogo size={28} color={colors.textPrimary} />
          <Text style={[styles.brandName, { color: colors.textPrimary }]}>
            Relay
          </Text>
        </View>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Dashboards
            </Text>
          </View>
        </View>
        <DashboardSkeletonList />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Brand header */}
      <View style={styles.brandHeader}>
        <RelayLogo size={28} color={colors.textPrimary} />
        <Text style={[styles.brandName, { color: colors.textPrimary }]}>
          Relay
        </Text>
      </View>

      {/* Plan badge for free users */}
      {plan === "free" ? (
        <View style={styles.planBadgeRow}>
          <View
            style={[
              styles.planBadge,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.planBadgeText, { color: colors.textSecondary }]}>
              Free plan
            </Text>
            <Text style={[styles.planBadgeDot, { color: colors.textTertiary }]}>
              ·
            </Text>
            <Text style={[styles.planBadgeLimit, { color: colors.textTertiary }]}>
              {ownedAppCount}/{FREE_LIMITS.dashboards} dashboards
            </Text>
          </View>
        </View>
      ) : null}

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Dashboards
          </Text>
          <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
            {appCount} {appCount === 1 ? "app" : "apps"}
          </Text>
        </View>
        <PressableScale
          activeScale={0.93}
          style={[
            styles.addButton,
            {
              backgroundColor: atLimit ? colors.surface : colors.accent,
              borderColor: atLimit ? colors.border : colors.accent,
              borderWidth: atLimit ? 1 : 0,
            },
          ]}
          onPress={handleAdd}
        >
          <Feather
            name={atLimit ? "lock" : "plus"}
            size={16}
            color={atLimit ? colors.textSecondary : "#FFFFFF"}
          />
          <Text
            style={[
              styles.addButtonText,
              { color: atLimit ? colors.textSecondary : "#FFFFFF" },
            ]}
          >
            {atLimit ? "Limit" : "Add"}
          </Text>
        </PressableScale>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            Failed to load apps. Pull to retry.
          </Text>
        </View>
      ) : null}

      <FlatList
        data={apps ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          (!apps || apps.length === 0) && styles.listEmpty,
        ]}
        ListHeaderComponent={
          atLimit ? (
            <UpgradePrompt
              compact
              message="Dashboard limit reached on the current plan"
            />
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="layers"
            title="No dashboards yet"
            subtitle="Add your first dashboard or tool to get started with push notifications."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  brandName: {
    fontSize: fontSizes.xl,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  planBadgeRow: {
    alignItems: "center",
    paddingTop: spacing.xs,
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  planBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
  },
  planBadgeDot: {
    fontSize: fontSizes.xs,
  },
  planBadgeLimit: {
    fontSize: fontSizes.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md + 4,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  sectionCount: {
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radii.full,
  },
  addButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  listEmpty: {
    flex: 1,
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
    gap: 2,
  },
  cardName: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    flexShrink: 1,
  },
  cardHost: {
    fontSize: fontSizes.xs,
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  notifDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardNotif: {
    fontSize: fontSizes.xs,
    flex: 1,
  },
  errorContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  errorText: {
    fontSize: fontSizes.sm,
  },
});
