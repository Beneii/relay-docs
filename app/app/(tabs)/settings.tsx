import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useProfile } from "@/hooks/useProfile";
import { useApps } from "@/hooks/useApps";
import { useMonthlyNotificationCount } from "@/hooks/useNotifications";
import { openUpgradeWithSession } from "@/components/UpgradePrompt";
import { useTheme, spacing, fontSizes, radii } from "@/theme";
import type { ThemeMode } from "@/theme";
import { getLimits } from "@shared/product";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

function SettingsRow({
  label,
  value,
  iconName,
  onPress,
}: {
  label: string;
  value?: string;
  iconName?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      style={[styles.row, { borderColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.rowLeft}>
        {iconName ? (
          <Feather name={iconName} size={18} color={colors.textSecondary} />
        ) : null}
        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
          {label}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {value ? (
          <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
            {value}
          </Text>
        ) : null}
        {onPress ? (
          <Feather name="chevron-right" size={16} color={colors.textTertiary} />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { themeMode, setThemeMode } = useSettingsStore();
  const { data: profile } = useProfile();
  const { data: apps } = useApps();
  const [notifStatus, setNotifStatus] = useState<string>("checking...");
  const [quietEnabled, setQuietEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState("23:00");
  const [quietEnd, setQuietEnd] = useState("07:00");

  const { data: monthlyNotifCount } = useMonthlyNotificationCount();

  const { data: deviceCount } = useQuery({
    queryKey: ["devices", "count"],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("devices")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const plan = profile?.plan ?? "free";
  const isPro = plan === "pro";
  const limits = getLimits(plan);
  const appCount = apps?.length ?? 0;
  const notifCount = monthlyNotifCount ?? 0;
  const devCount = deviceCount ?? 0;
  const cancelAtPeriodEnd = profile?.cancel_at_period_end ?? false;
  const billingInterval = profile?.billing_interval ?? null;
  const currentPeriodEnd = profile?.current_period_end ?? null;

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setNotifStatus(status === "granted" ? "Enabled" : "Disabled");
    });
  }, []);

  // Load quiet hours from the current device record
  useEffect(() => {
    if (!user || Platform.OS === "web") return;
    (async () => {
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId || projectId === "YOUR_EAS_PROJECT_ID") return;
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        const { data } = await supabase
          .from("devices")
          .select("quiet_start, quiet_end")
          .eq("user_id", user.id)
          .eq("expo_push_token", tokenData.data)
          .maybeSingle();
        if (data) {
          if (data.quiet_start && data.quiet_end) {
            setQuietEnabled(true);
            setQuietStart(data.quiet_start.slice(0, 5));
            setQuietEnd(data.quiet_end.slice(0, 5));
          }
        }
      } catch (err) {
        console.error("Failed to load quiet hours:", err);
      }
    })();
  }, [user]);

  const saveQuietHours = useCallback(
    async (enabled: boolean, start: string, end: string) => {
      if (!user || Platform.OS === "web") return;
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId || projectId === "YOUR_EAS_PROJECT_ID") return;
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        const utcOffsetMinutes = -new Date().getTimezoneOffset();
        await supabase
          .from("devices")
          .update({
            quiet_start: enabled ? start : null,
            quiet_end: enabled ? end : null,
            utc_offset_minutes: utcOffsetMinutes,
          })
          .eq("user_id", user.id)
          .eq("expo_push_token", tokenData.data);
      } catch (err) {
        console.error("Failed to save quiet hours:", err);
      }
    },
    [user]
  );

  function handleToggleQuietHours() {
    const newEnabled = !quietEnabled;
    setQuietEnabled(newEnabled);
    saveQuietHours(newEnabled, quietStart, quietEnd);
  }

  function cycleQuietTime(current: string, field: "start" | "end") {
    const [h] = current.split(":").map(Number);
    const nextHour = (h + 1) % 24;
    const newTime = `${String(nextHour).padStart(2, "0")}:00`;
    if (field === "start") {
      setQuietStart(newTime);
      if (quietEnabled) saveQuietHours(true, newTime, quietEnd);
    } else {
      setQuietEnd(newTime);
      if (quietEnabled) saveQuietHours(true, quietStart, newTime);
    }
  }

  function handleThemeChange() {
    const currentIndex = THEME_OPTIONS.findIndex((o) => o.value === themeMode);
    const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
    setThemeMode(THEME_OPTIONS[nextIndex].value);
  }

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          if (user && Platform.OS !== "web") {
            try {
              // Get the Expo push token
              const projectId = Constants.expoConfig?.extra?.eas?.projectId;
              if (projectId && projectId !== "YOUR_EAS_PROJECT_ID") {
                const tokenData = await Notifications.getExpoPushTokenAsync({
                  projectId,
                });
                const expoPushToken = tokenData.data;

                // Delete the device row while the session is still valid
                await supabase
                  .from("devices")
                  .delete()
                  .eq("user_id", user.id)
                  .eq("expo_push_token", expoPushToken);
              }
            } catch (error) {
              console.error("Failed to deregister device:", error);
            }
          }

          await supabase.auth.signOut();
        },
      },
    ]);
  }

  function handleOpenNotifSettings() {
    Linking.openSettings();
  }

  function handleUpgrade() {
    openUpgradeWithSession("/pricing");
  }

  function handleManageBilling() {
    openUpgradeWithSession("/dashboard");
  }

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Plan section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            Plan
          </Text>
          <View
            style={[
              styles.planCard,
              {
                backgroundColor: isPro ? colors.accentSubtle : colors.surfaceElevated,
                borderColor: isPro ? colors.accent + "40" : colors.border,
              },
            ]}
          >
            <View style={styles.planHeader}>
              <View style={styles.planNameRow}>
                <Feather
                  name={isPro ? "zap" : "box"}
                  size={18}
                  color={isPro ? colors.accent : colors.textSecondary}
                />
                <Text style={[styles.planName, { color: colors.textPrimary }]}>
                  {isPro ? "Pro" : "Free"}
                </Text>
                {isPro ? (
                  <View style={[styles.proBadge, { backgroundColor: cancelAtPeriodEnd ? colors.warning : colors.accent }]}>
                    <Text style={styles.proBadgeText}>{cancelAtPeriodEnd ? "Canceling" : "Active"}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Subscription details for Pro users */}
            {isPro && (billingInterval || currentPeriodEnd) ? (
              <View style={styles.subscriptionInfo}>
                {billingInterval ? (
                  <Text style={[styles.subscriptionText, { color: colors.textSecondary }]}>
                    {billingInterval === "year" ? "Annual" : "Monthly"} plan
                  </Text>
                ) : null}
                {currentPeriodEnd ? (
                  <Text style={[styles.subscriptionText, { color: cancelAtPeriodEnd ? colors.warning : colors.textTertiary }]}>
                    {cancelAtPeriodEnd ? "Ends" : "Renews"}{" "}
                    {new Date(currentPeriodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* Usage stats */}
            <View style={styles.usageRow}>
              <View style={styles.usageStat}>
                <Text style={[styles.usageValue, { color: colors.textPrimary }]}>
                  {appCount}
                </Text>
                <Text style={[styles.usageLabel, { color: colors.textTertiary }]}>
                  / {limits.dashboards === Infinity ? "∞" : limits.dashboards} dashboards
                </Text>
              </View>
              <View style={styles.usageStat}>
                <Text style={[styles.usageValue, { color: colors.textPrimary }]}>
                  {devCount}
                </Text>
                <Text style={[styles.usageLabel, { color: colors.textTertiary }]}>
                  / {limits.devices} devices
                </Text>
              </View>
              <View style={styles.usageStat}>
                <Text style={[styles.usageValue, { color: colors.textPrimary }]}>
                  {notifCount}
                </Text>
                <Text style={[styles.usageLabel, { color: colors.textTertiary }]}>
                  / {limits.notificationsPerMonth === 10_000 ? "10k" : limits.notificationsPerMonth} notifs/mo
                </Text>
              </View>
            </View>

            {isPro ? (
              <Pressable
                style={[styles.manageBillingButton, { borderColor: colors.border }]}
                onPress={handleManageBilling}
              >
                <Text style={[styles.manageBillingText, { color: colors.textSecondary }]}>
                  Manage billing
                </Text>
                <Feather name="external-link" size={13} color={colors.textTertiary} />
              </Pressable>
            ) : (
              <Pressable
                style={[styles.upgradeButton, { backgroundColor: colors.accent }]}
                onPress={handleUpgrade}
              >
                <Feather name="zap" size={16} color="#FFFFFF" />
                <Text style={styles.upgradeButtonText}>
                  Upgrade to Pro — $7.99/mo
                </Text>
                <Feather name="external-link" size={13} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            Account
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
          >
            <SettingsRow label="Email" value={user?.email ?? "—"} iconName="mail" />
          </View>
        </View>

        {/* Preferences section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            Preferences
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
          >
            <SettingsRow
              label="Theme"
              value={THEME_OPTIONS.find((o) => o.value === themeMode)?.label}
              iconName="moon"
              onPress={handleThemeChange}
            />
            <SettingsRow
              label="Notifications"
              value={notifStatus}
              iconName="bell"
              onPress={handleOpenNotifSettings}
            />
          </View>
        </View>

        {/* Quiet Hours section */}
        {Platform.OS !== "web" ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
              Quiet Hours
            </Text>
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
            >
              <Pressable
                style={[styles.row, { borderColor: colors.border }]}
                onPress={handleToggleQuietHours}
              >
                <View style={styles.rowLeft}>
                  <Feather name="moon" size={18} color={colors.textSecondary} />
                  <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                    Enable quiet hours
                  </Text>
                </View>
                <View
                  style={[
                    styles.toggle,
                    { backgroundColor: quietEnabled ? colors.accent : colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleKnob,
                      { transform: [{ translateX: quietEnabled ? 18 : 2 }] },
                    ]}
                  />
                </View>
              </Pressable>
              {quietEnabled ? (
                <>
                  <Pressable
                    style={[styles.row, { borderColor: colors.border }]}
                    onPress={() => cycleQuietTime(quietStart, "start")}
                  >
                    <View style={styles.rowLeft}>
                      <Feather name="sunset" size={18} color={colors.textSecondary} />
                      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                        Start
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
                        {quietStart}
                      </Text>
                      <Feather name="chevron-right" size={16} color={colors.textTertiary} />
                    </View>
                  </Pressable>
                  <Pressable
                    style={[styles.row, { borderColor: colors.border }]}
                    onPress={() => cycleQuietTime(quietEnd, "end")}
                  >
                    <View style={styles.rowLeft}>
                      <Feather name="sunrise" size={18} color={colors.textSecondary} />
                      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                        End
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
                        {quietEnd}
                      </Text>
                      <Feather name="chevron-right" size={16} color={colors.textTertiary} />
                    </View>
                  </Pressable>
                  <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
                    <Text style={[{ fontSize: fontSizes.xs, color: colors.textTertiary }]}>
                      Critical notifications will still break through quiet hours.
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Pressable
            style={[
              styles.signOutButton,
              { backgroundColor: colors.dangerSubtle },
            ]}
            onPress={handleSignOut}
          >
            <Feather name="log-out" size={18} color={colors.danger} style={{ marginRight: spacing.sm }} />
            <Text style={[styles.signOutText, { color: colors.danger }]}>
              Sign Out
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.version, { color: colors.textTertiary }]}>
          Relay v{appVersion}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    fontSize: fontSizes.xxxl,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: spacing.xs,
  },
  sectionCard: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  planCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  planName: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
  },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  proBadgeText: {
    color: "#FFFFFF",
    fontSize: fontSizes.xs,
    fontWeight: "600",
  },
  subscriptionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subscriptionText: {
    fontSize: fontSizes.xs,
  },
  usageRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  usageStat: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  usageValue: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
  },
  usageLabel: {
    fontSize: fontSizes.xs,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 42,
    borderRadius: radii.md,
  },
  upgradeButtonText: {
    color: "#FFFFFF",
    fontSize: fontSizes.sm,
    fontWeight: "600",
  },
  manageBillingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    height: 38,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  manageBillingText: {
    fontSize: fontSizes.sm,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  rowLabel: {
    fontSize: fontSizes.md,
  },
  rowValue: {
    fontSize: fontSizes.md,
  },
  signOutButton: {
    height: 48,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  signOutText: {
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
  toggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  version: {
    fontSize: fontSizes.xs,
    textAlign: "center",
  },
});
