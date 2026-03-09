import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useUnreadCount,
} from "@/hooks/useNotifications";
import { useApps } from "@/hooks/useApps";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { timeAgo } from "@/utils/time";
import { useTheme, spacing, fontSizes, radii } from "@/theme";
import type { NotificationRow } from "@/types/database";

function NotificationItem({
  notification,
  appName,
}: {
  notification: NotificationRow;
  appName: string | undefined;
}) {
  const { colors } = useTheme();
  const markAsRead = useMarkAsRead();
  const isUnread = !notification.read_at;

  function handlePress() {
    if (isUnread) {
      markAsRead.mutate(notification.id);
    }
    router.push({
      pathname: "/app/[id]",
      params: { id: notification.app_id },
    });
  }

  return (
    <Pressable
      style={[
        styles.notifCard,
        {
          backgroundColor: isUnread
            ? colors.accentSubtle
            : colors.surfaceElevated,
          borderColor: colors.border,
        },
      ]}
      onPress={handlePress}
    >
      <View style={styles.notifHeader}>
        <View style={styles.notifTitleRow}>
          {isUnread ? (
            <View
              style={[styles.unreadDot, { backgroundColor: colors.accent }]}
            />
          ) : null}
          <Text
            style={[
              styles.notifTitle,
              {
                color: colors.textPrimary,
                fontWeight: isUnread ? "600" : "400",
              },
            ]}
            numberOfLines={1}
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
          numberOfLines={2}
        >
          {notification.body}
        </Text>
      ) : null}
      {appName ? (
        <Text style={[styles.notifApp, { color: colors.textTertiary }]}>
          {appName}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const {
    data: notifications,
    isLoading,
    refetch,
  } = useNotifications();
  const { data: apps } = useApps();
  const { data: unreadCount } = useUnreadCount();
  const markAllAsRead = useMarkAllAsRead();

  const appMap = new Map(apps?.map((a) => [a.id, a.name]) ?? []);

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Alerts
        </Text>
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
        data={notifications ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            appName={appMap.get(item.app_id)}
          />
        )}
        contentContainerStyle={[
          styles.list,
          (!notifications || notifications.length === 0) && styles.listEmpty,
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="bell"
            title="No notifications yet"
            subtitle="When external systems send alerts to your saved apps, they'll appear here."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={false}
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
});
