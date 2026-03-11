import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl,
  Platform,
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
import { LoadingScreen } from "@/components/LoadingScreen";
import { UpgradePrompt, openUpgradeWithSession } from "@/components/UpgradePrompt";
import { extractHostname } from "@/utils/url";
import { timeAgo } from "@/utils/time";
import { Feather } from "@expo/vector-icons";
import { FREE_LIMITS } from "@shared/product";
import { RelayLogo } from "@/components/RelayLogo";
import { useTheme, spacing, fontSizes, radii } from "@/theme";
import type { AppRow } from "@/types/database";

function AppCard({ app }: { app: AppRow }) {
  const { colors } = useTheme();
  const latestNotifications = useLatestNotificationByApp();
  const deleteApp = useDeleteApp();
  const latestNotification = latestNotifications.get(app.id);

  function handlePress() {
    if (Platform.OS === "web") {
      window.open(app.url, "_blank", "noopener");
    } else {
      router.push({ pathname: "/app/[id]", params: { id: app.id } });
    }
  }

  function handleLongPress() {
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
    <Pressable
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
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
    </Pressable>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { data: apps, isLoading, isFetching, error, refetch } = useApps();
  const { data: profile } = useProfile();

  const plan = profile?.plan ?? "free";
  const appCount = apps?.length ?? 0;
  const atLimit = plan === "free" && appCount >= FREE_LIMITS.dashboards;

  const renderItem = useCallback(
    ({ item }: { item: AppRow }) => <AppCard app={item} />,
    []
  );

  function handleAdd() {
    if (atLimit) {
      Alert.alert(
        "Dashboard limit reached",
        `Free accounts are limited to ${FREE_LIMITS.dashboards} dashboards. Upgrade to Pro for unlimited dashboards.`,
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Upgrade",
            onPress: () => openUpgradeWithSession("/pricing"),
          },
        ]
      );
      return;
    }
    router.push("/edit-app");
  }

  if (isLoading) return <LoadingScreen />;

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
              {appCount}/{FREE_LIMITS.dashboards} dashboards
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
        <Pressable
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
        </Pressable>
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
              message="Upgrade to add unlimited dashboards"
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
