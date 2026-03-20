import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import { useAuthStore } from "@/stores/authStore";
import { useApp, useCreateApp, useUpdateApp, useDeleteApp } from "@/hooks/useApps";
import { useProfile } from "@/hooks/useProfile";
import { AppIcon, ICON_KEYS } from "@/components/AppIcon";
import { LoadingScreen } from "@/components/LoadingScreen";
import { validateUrl } from "@/utils/url";
import { Feather } from "@expo/vector-icons";
import { useTheme, spacing, fontSizes, radii } from "@/theme";
import { AnimatedToggle } from "@/components/AnimatedToggle";
import { PressableScale } from "@/components/PressableScale";

function isValidHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

const ACCENT_COLORS = [
  "#10B981", // emerald (default — matches brand)
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#EF4444", // red
  "#F59E0B", // amber
  "#3B82F6", // blue
  "#06B6D4", // cyan
  "#6366F1", // indigo
];

export default function EditAppScreen() {
  const session = useAuthStore((s) => s.session);
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!params.id;
  const { data: existingApp, isLoading: loadingApp } = useApp(params.id ?? "");
  const { data: profile } = useProfile();
  const createApp = useCreateApp();
  const updateApp = useUpdateApp();
  const deleteApp = useDeleteApp();

  if (!session) return <Redirect href="/auth" />;

  const isPro = profile?.plan === "pro";

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState<string>("globe");
  const [accentColor, setAccentColor] = useState<string>(ACCENT_COLORS[0]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [heartbeatInterval, setHeartbeatInterval] = useState<number | null>(null);
  const [manifestDetected, setManifestDetected] = useState(false);
  const [customAppName, setCustomAppName] = useState("");
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("");

  // Auto-fetch relay.json manifest
  useEffect(() => {
    setManifestDetected(false);
    const urlValidation = validateUrl(url);
    if (!url || !urlValidation.valid || isEditing) return;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const normalized = urlValidation.normalized.replace(/\/+$/, "");
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${normalized}/relay.json`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        clearTimeout(timeoutId);

        if (controller.signal.aborted || !res.ok) return;
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("json") && !contentType.includes("text/plain")) return;

        const text = await res.text();
        if (controller.signal.aborted) return;
        if (text.length > 10000) return;
        const manifest = JSON.parse(text);

        if (typeof manifest !== "object" || manifest === null) return;

        setManifestDetected(true);
        if (manifest.name && !name) {
          setName(manifest.name);
        }
        if (manifest.theme_color && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(manifest.theme_color)) {
          setAccentColor(manifest.theme_color);
        }
        if (manifest.notifications === false) {
          setNotificationsEnabled(false);
        }
      } catch {
        // ignore fetch/parse/abort errors
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [url, isEditing, name]);

  // Populate form when editing
  useEffect(() => {
    if (existingApp) {
      setName(existingApp.name);
      setUrl(existingApp.url);
      setIcon(existingApp.icon ?? "globe");
      setAccentColor(existingApp.accent_color ?? ACCENT_COLORS[0]);
      setNotificationsEnabled(existingApp.notifications_enabled);
      setHeartbeatInterval(existingApp.heartbeat_interval_minutes ?? null);
      setCustomAppName(existingApp.custom_app_name ?? "");
      setCustomIconUrl(existingApp.custom_icon_url ?? "");
      setBackgroundColor(existingApp.background_color ?? "");
    }
  }, [existingApp]);

  const urlValidation = validateUrl(url);
  const iconUrlInvalid = customIconUrl.trim().length > 0 && !isValidHttpsUrl(customIconUrl.trim());
  const canSave = name.trim().length > 0 && urlValidation.valid && !iconUrlInvalid;

  async function handleSave() {
    if (!canSave) return;

    try {
      const brandingFields = isPro
        ? {
            custom_app_name: customAppName.trim() || null,
            custom_icon_url: customIconUrl.trim() || null,
            background_color: backgroundColor.trim() || null,
          }
        : {};

      if (isEditing && params.id) {
        await updateApp.mutateAsync({
          id: params.id,
          updates: {
            name: name.trim(),
            url: urlValidation.normalized,
            icon,
            accent_color: accentColor,
            notifications_enabled: notificationsEnabled,
            heartbeat_interval_minutes: heartbeatInterval,
            ...brandingFields,
          },
        });
      } else {
        await createApp.mutateAsync({
          name: name.trim(),
          url: urlValidation.normalized,
          icon,
          accent_color: accentColor,
          notifications_enabled: notificationsEnabled,
          heartbeat_interval_minutes: heartbeatInterval,
          ...brandingFields,
        });
      }
      router.back();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Error", message);
    }
  }

  function handleDelete() {
    if (!params.id) return;
    Alert.alert("Delete App", `Are you sure you want to delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteApp.mutateAsync(params.id!);
            router.back();
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to delete app";
            Alert.alert("Error", message);
          }
        },
      },
    ]);
  }

  async function handleCopyWebhook() {
    if (!existingApp?.webhook_token) {
      Alert.alert("Unavailable", "Only the dashboard owner can view this webhook.");
      return;
    }
    const supabaseUrl =
      Constants.expoConfig?.extra?.supabaseUrl ??
      process.env.EXPO_PUBLIC_SUPABASE_URL ??
      "YOUR_SUPABASE_URL";
    const webhookUrl = `${supabaseUrl}/functions/v1/notify/${existingApp.webhook_token}`;
    await Clipboard.setStringAsync(webhookUrl);
    Alert.alert("Copied", "Webhook URL copied to clipboard.");
  }

  const isSaving = createApp.isPending || updateApp.isPending;

  if (isEditing && loadingApp) return <LoadingScreen />;

  if (isEditing && existingApp && !existingApp.is_owner) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBack}>
            <Feather name="chevron-left" size={24} color={colors.accent} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Edit App
          </Text>
          <View style={styles.headerBack} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.md }}>
          <Feather name="lock" size={28} color={colors.warning} />
          <Text style={{ color: colors.textPrimary, fontSize: fontSizes.lg, fontWeight: "600", textAlign: "center" }}>
            Owners only
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: fontSizes.md, textAlign: "center" }}>
            This dashboard can be opened here, but only the owner can edit its settings or view the webhook.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBack}>
          <Feather name="chevron-left" size={24} color={colors.accent} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {isEditing ? "Edit App" : "Add App"}
        </Text>
        <Pressable onPress={handleSave} disabled={!canSave || isSaving}>
          {isSaving ? (
            <ActivityIndicator color={colors.accent} size="small" />
          ) : (
            <Text
              style={[
                styles.headerAction,
                {
                  color: canSave ? colors.accent : colors.textTertiary,
                  fontWeight: "600",
                },
              ]}
            >
              Save
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        {/* Preview */}
        <View style={styles.previewContainer}>
          <AppIcon icon={icon} accentColor={accentColor} size={64} />
        </View>

        {/* Name */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                borderColor: colors.border,
              },
            ]}
            placeholder="My Dashboard"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        {/* URL */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            URL
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                borderColor: url && !urlValidation.valid
                  ? colors.danger
                  : colors.border,
              },
            ]}
            placeholder="https://dashboard.example.com"
            placeholderTextColor={colors.textTertiary}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
          />
          {manifestDetected && (
            <Text style={[styles.fieldHint, { color: colors.accent, marginTop: 4 }]}>
              Configured from relay.json
            </Text>
          )}
          {url && urlValidation.warning ? (
            <Text
              style={[
                styles.fieldHint,
                {
                  color: urlValidation.valid
                    ? colors.warning
                    : colors.danger,
                },
              ]}
            >
              {urlValidation.warning}
            </Text>
          ) : null}
        </View>

        {/* Icon */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Icon
          </Text>
          <View style={styles.iconGrid}>
            {ICON_KEYS.map((key) => (
              <Pressable
                key={key}
                style={[
                  styles.iconOption,
                  {
                    backgroundColor:
                      icon === key ? colors.accentSubtle : colors.surface,
                    borderColor:
                      icon === key ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setIcon(key)}
              >
                <AppIcon icon={key} accentColor={icon === key ? accentColor : null} size={28} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Color */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Color
          </Text>
          <View style={styles.colorGrid}>
            {ACCENT_COLORS.map((c) => (
              <Pressable
                key={c}
                style={[
                  styles.colorOption,
                  {
                    backgroundColor: c,
                    borderColor:
                      accentColor === c ? colors.textPrimary : "transparent",
                  },
                ]}
                onPress={() => setAccentColor(c)}
              />
            ))}
          </View>
        </View>

        {/* Custom Branding (Pro) */}
        <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border, paddingVertical: 16, paddingHorizontal: spacing.md, borderRadius: 12, borderWidth: 1 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <View>
              <Text style={[styles.label, { color: colors.textPrimary, paddingHorizontal: 0 }]}>Custom branding</Text>
              <Text style={[styles.fieldHint, { color: colors.textTertiary, paddingHorizontal: 0 }]}>
                Override display name, icon, and background color.
              </Text>
            </View>
            {!isPro && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.accentSubtle, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                <Feather name="lock" size={12} color={colors.accent} />
                <Text style={{ fontSize: fontSizes.xs, color: colors.accent, fontWeight: "600" }}>Pro</Text>
              </View>
            )}
          </View>
          <View style={{ gap: spacing.sm, marginTop: spacing.sm, opacity: isPro ? 1 : 0.4 }}>
            <View style={{ gap: 4 }}>
              <Text style={[styles.fieldHint, { color: colors.textSecondary, paddingHorizontal: 0 }]}>Display name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Same as app name"
                placeholderTextColor={colors.textTertiary}
                value={customAppName}
                onChangeText={isPro ? setCustomAppName : undefined}
                editable={isPro}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={[styles.fieldHint, { color: colors.textSecondary, paddingHorizontal: 0 }]}>Icon URL</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: iconUrlInvalid ? colors.danger : colors.border }]}
                placeholder="https://example.com/icon.png"
                placeholderTextColor={colors.textTertiary}
                value={customIconUrl}
                onChangeText={isPro ? setCustomIconUrl : undefined}
                editable={isPro}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {iconUrlInvalid && (
                <Text style={[styles.fieldHint, { color: colors.danger, paddingHorizontal: 0 }]}>Must be a valid https:// URL</Text>
              )}
            </View>
            <View style={{ gap: 4 }}>
              <Text style={[styles.fieldHint, { color: colors.textSecondary, paddingHorizontal: 0 }]}>Background color</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {ACCENT_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.colorOption, { backgroundColor: c + "30", borderColor: backgroundColor === c ? colors.textPrimary : "transparent" }]}
                    onPress={() => isPro && setBackgroundColor(backgroundColor === c ? "" : c)}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Notifications toggle */}
        <View
          style={[
            styles.toggleRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
            Notifications
          </Text>
          <AnimatedToggle
            value={notificationsEnabled}
            onToggle={() => setNotificationsEnabled(!notificationsEnabled)}
          />
        </View>

        {/* Heartbeat monitoring */}
        <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border, paddingVertical: 16 }]}>
          <View style={styles.heartbeatHeader}>
            <View>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Heartbeat monitoring</Text>
              <Text style={[styles.fieldHint, { color: colors.textTertiary }]}>
                Get alerted if your agent or cron job stops pinging Relay.
              </Text>
            </View>
            <AnimatedToggle
              value={!!heartbeatInterval}
              onToggle={() =>
                setHeartbeatInterval((current) => (current ? null : 15))
              }
            />
          </View>
          {heartbeatInterval ? (
            <View style={{ marginTop: 16 }}>
                <Text style={[styles.fieldHint, { color: colors.textSecondary, marginBottom: 10 }]}>
                Send a POST request to{" "}
                <Text style={{ fontFamily: "monospace" }}>https://relayapp.dev/api/heartbeat</Text> with
                {" "}
                <Text style={{ fontFamily: "monospace" }}>{`{ "token": "${existingApp?.webhook_token ?? "YOUR_TOKEN"}" }`}</Text>.
                Relay will notify you if no heartbeat arrives within the interval.
              </Text>
              <View style={styles.heartbeatOptions}>
                {[5, 15, 30, 60, 360].map((minutes) => (
                  <Pressable
                    key={minutes}
                    onPress={() => setHeartbeatInterval(minutes)}
                    style={[
                      styles.heartbeatOption,
                      {
                        borderColor:
                          heartbeatInterval === minutes ? colors.accent : colors.border,
                        backgroundColor:
                          heartbeatInterval === minutes ? colors.accent + "20" : colors.surface,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          heartbeatInterval === minutes ? colors.accent : colors.textSecondary,
                        fontWeight: heartbeatInterval === minutes ? "600" : "500",
                      }}
                    >
                      {minutes < 60
                        ? `${minutes} min`
                        : minutes === 60
                        ? "1 hour"
                        : `${minutes / 60} hours`}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {existingApp?.heartbeat_last_seen_at ? (
                <Text style={[styles.fieldHint, { color: colors.textSecondary, marginTop: 8 }]}>
                  Last heartbeat: {new Date(existingApp.heartbeat_last_seen_at).toLocaleString()}
                </Text>
              ) : (
                <Text style={[styles.fieldHint, { color: colors.textSecondary, marginTop: 8 }]}>
                  No heartbeats received yet.
                </Text>
              )}
            </View>
          ) : null}
        </View>

        {/* Webhook info */}
        {isEditing && existingApp ? (
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Webhook
            </Text>
            <Pressable
              style={[
                styles.webhookBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={handleCopyWebhook}
            >
              <Text
                style={[styles.webhookToken, { color: colors.textTertiary }]}
                numberOfLines={1}
              >
                POST /functions/v1/notify/{(existingApp.webhook_token ?? "YOUR_WEBHOOK_TOKEN").slice(0, 12)}...
              </Text>
              <Feather name="copy" size={16} color={colors.accent} />
            </Pressable>
            <Text style={[styles.fieldHint, { color: colors.textTertiary }]}>
              Send POST requests to this URL to push notifications to this app.
            </Text>
          </View>
        ) : (
          <View style={[styles.webhookHint, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="link" size={16} color={colors.textTertiary} />
            <Text style={[styles.webhookHintText, { color: colors.textTertiary }]}>
              A unique webhook URL will be generated when you save.
            </Text>
          </View>
        )}

        {/* Delete (edit mode only) */}
        {isEditing ? (
          <PressableScale
            activeScale={0.97}
            style={[
              styles.deleteButton,
              { backgroundColor: colors.dangerSubtle },
            ]}
            onPress={handleDelete}
          >
            <Text style={[styles.deleteText, { color: colors.danger }]}>
              Delete App
            </Text>
          </PressableScale>
        ) : null}
      </ScrollView>
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
  headerBack: {
    width: 36,
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "600",
  },
  headerAction: {
    fontSize: fontSizes.md,
  },
  form: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  previewContainer: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: "500",
    paddingHorizontal: spacing.xs,
  },
  input: {
    height: 48,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.md,
    borderWidth: 1,
  },
  fieldHint: {
    fontSize: fontSizes.xs,
    paddingHorizontal: spacing.xs,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  colorGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 2.5,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  toggleLabel: {
    fontSize: fontSizes.md,
  },
  heartbeatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  heartbeatOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heartbeatOption: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  webhookBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  webhookToken: {
    fontSize: fontSizes.sm,
    fontFamily: "Courier",
    flex: 1,
  },
  webhookHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  webhookHintText: {
    fontSize: fontSizes.sm,
    flex: 1,
  },
  deleteButton: {
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  deleteText: {
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
});
