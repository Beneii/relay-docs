import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useMarkAllAsRead,
  useUnreadCount,
  usePaginatedNotifications,
} from "@/hooks/useNotifications";
import { useApps } from "@/hooks/useApps";
import { useProfile } from "@/hooks/useProfile";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { timeAgo } from "@/utils/time";
import { useTheme, spacing, fontSizes, radii } from "@/theme";
import type { NotificationRow } from "@/types/database";

const FREE_VISIBLE_LIMIT = 20;

type Severity = "info" | "warning" | "critical" | null;

function SeverityBadge({ severity }: { severity: Severity }) {
  if (!severity || severity === "info") return null;

  const { colors } = useTheme();
  const config =
    severity === "critical"
      ? { label: "Critical", bg: colors.danger + "20", text: colors.danger }
      : { label: "Warning", bg: "#F59E0B20", text: "#F59E0B" };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

function ChannelTag({ channel }: { channel: string | null }) {
  const { colors } = useTheme();
  if (!channel) return null;
  return (
    <View style={[styles.badge, { backgroundColor: colors.surfaceElevated, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
      <Text style={[styles.badgeText, { color: colors.textTertiary }]}>#{channel}</Text>
    </View>
  );
}

function NotificationItem({
  notification,
  appName,
}: {
  notification: NotificationRow;
  appName: string | undefined;
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const isUnread = !notification.read_at;

  return (
    <Pressable
      style={[
        styles.notifCard,
        {
          backgroundColor: isUnread ? colors.accentSubtle : colors.surfaceElevated,
          borderColor: colors.border,
        },
      ]}
      onPress={() => setExpanded((v) => !v)}
    >
      <View style={styles.notifHeader}>
        <View style={styles.notifTitleRow}>
          {isUnread ? (
            <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
          ) : null}
          <Text
            style={[
              styles.notifTitle,
              { color: colors.textPrimary, fontWeight: isUnread ? "600" : "400" },
            ]}
            numberOfLines={expanded ? undefined : 1}
          >
            {notification.title}
          </Text>
        </View>
        <Text style={[styles.notifTime, { color: colors.textTertiary }]}>
          {timeAgo(notification.created_at)}
        </Text>
      </View>

      {notification.body ? (
        <Text
          style={[styles.notifBody, { color: colors.textSecondary }]}
          numberOfLines={expanded ? undefined : 2}
        >
          {notification.body}
        </Text>
      ) : null}

      {/* Metadata row: app, severity badge, channel tag */}
      <View style={styles.metaRow}>
        {appName ? (
          <Text style={[styles.notifApp, { color: colors.textTertiary }]}>{appName}</Text>
        ) : null}
        <SeverityBadge severity={notification.severity} />
        <ChannelTag channel={notification.channel} />
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { notifications, loading, refreshing, hasMore, refresh, loadMore, fetchPage } =
    usePaginatedNotifications();
  const { data: apps } = useApps();
  const { data: profile } = useProfile();
  const { data: unreadCount } = useUnreadCount();
  const markAllAsRead = useMarkAllAsRead();

  const isPro = profile?.plan === "pro";
  const appMap = new Map(apps?.map((a) => [a.id, a.name]) ?? []);

  // Initial load
  useEffect(() => {
    fetchPage(null, true);
  }, [fetchPage]);

  const visibleNotifications = useMemo(() => {
    if (isPro) return notifications;
    return notifications.slice(0, FREE_VISIBLE_LIMIT);
  }, [notifications, isPro]);

  const hasMoreForFree = !isPro && notifications.length > FREE_VISIBLE_LIMIT;
  const showLoadMore = isPro && hasMore;

  if (loading && notifications.length === 0) return <LoadingScreen />;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Alerts</Text>
        {(unreadCount ?? 0) > 0 ? (
          <Pressable
            onPress={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <Text style={[styles.markAllRead, { color: colors.accent }]}>
              Mark all read
            </Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={visibleNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            appName={appMap.get(item.app_id)}
          />
        )}
        contentContainerStyle={[
          styles.list,
          visibleNotifications.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="bell"
            title="No notifications yet"
            subtitle="When external systems send alerts to your saved apps, they'll appear here."
          />
        }
        ListFooterComponent={
          hasMoreForFree ? (
            <UpgradePrompt
              compact
              message="Notification history is limited on the current plan"
            />
          ) : showLoadMore ? (
            <Pressable onPress={loadMore} style={styles.loadMore}>
              {loading ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Text style={[styles.loadMoreText, { color: colors.accent }]}>
                  Load more
                </Text>
              )}
            </Pressable>
          ) : null
        }
        onEndReached={isPro ? loadMore : undefined}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    fontSize: fontSizes.xxxl,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  markAllRead: {
    fontSize: fontSizes.sm,
    fontWeight: "500",
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  listEmpty: {
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
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifTitle: {
    fontSize: fontSizes.md,
    flex: 1,
  },
  notifTime: {
    fontSize: fontSizes.xs,
    marginLeft: spacing.sm,
  },
  notifBody: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
  },
  notifApp: {
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  loadMore: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  loadMoreText: {
    fontSize: fontSizes.sm,
    fontWeight: "500",
  },
});
