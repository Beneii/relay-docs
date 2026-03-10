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
import { AppIcon, ICON_KEYS } from "@/components/AppIcon";
import { LoadingScreen } from "@/components/LoadingScreen";
import { validateUrl } from "@/utils/url";
import { Feather } from "@expo/vector-icons";
import { useTheme, spacing, fontSizes, radii } from "@/theme";

const ACCENT_COLORS = [
  "#10B981", // emerald
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

  if (!session) return <Redirect href="/auth" />;

  const { data: existingApp, isLoading: loadingApp } = useApp(params.id ?? "");
  const createApp = useCreateApp();
  const updateApp = useUpdateApp();
  const deleteApp = useDeleteApp();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState<string>("globe");
  const [accentColor, setAccentColor] = useState<string>(ACCENT_COLORS[0]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [manifestDetected, setManifestDetected] = useState(false);

  // Auto-fetch relay.json manifest
  useEffect(() => {
    setManifestDetected(false);
    const urlValidation = validateUrl(url);
    if (!url || !urlValidation.valid || isEditing) return;

    const timer = setTimeout(async () => {
      try {
        const normalized = urlValidation.normalized.replace(/\/+$/, "");
        const controller = new AbortController();
        const abortTimer = setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch(`${normalized}/relay.json`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        clearTimeout(abortTimer);
        
        if (!res.ok) return;
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("json") && !contentType.includes("text/plain")) return;
        
        const text = await res.text();
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
      } catch (err) {
        // ignore fetch/parse errors
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [url, isEditing, name]);

  // Populate form when editing
  useEffect(() => {
    if (existingApp) {
      setName(existingApp.name);
      setUrl(existingApp.url);
      setIcon(existingApp.icon ?? "globe");
      setAccentColor(existingApp.accent_color ?? ACCENT_COLORS[0]);
      setNotificationsEnabled(existingApp.notifications_enabled);
    }
  }, [existingApp]);

  const urlValidation = validateUrl(url);
  const canSave = name.trim().length > 0 && urlValidation.valid;

  async function handleSave() {
    if (!canSave) return;

    try {
      if (isEditing && params.id) {
        await updateApp.mutateAsync({
          id: params.id,
          updates: {
            name: name.trim(),
            url: urlValidation.normalized,
            icon,
            accent_color: accentColor,
            notifications_enabled: notificationsEnabled,
          },
        });
      } else {
        await createApp.mutateAsync({
          name: name.trim(),
          url: urlValidation.normalized,
          icon,
          accent_color: accentColor,
          notifications_enabled: notificationsEnabled,
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
          await deleteApp.mutateAsync(params.id!);
          router.back();
        },
      },
    ]);
  }

  async function handleCopyWebhook() {
    if (!existingApp) return;
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

        {/* Notifications toggle */}
        <Pressable
          style={[
            styles.toggleRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => setNotificationsEnabled(!notificationsEnabled)}
        >
          <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
            Notifications
          </Text>
          <View
            style={[
              styles.toggle,
              {
                backgroundColor: notificationsEnabled
                  ? colors.accent
                  : colors.textTertiary,
              },
            ]}
          >
            <View
              style={[
                styles.toggleKnob,
                {
                  transform: [
                    { translateX: notificationsEnabled ? 18 : 2 },
                  ],
                },
              ]}
            />
          </View>
        </Pressable>

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
                POST /functions/v1/notify/{existingApp.webhook_token.slice(0, 12)}...
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
          <Pressable
            style={[
              styles.deleteButton,
              { backgroundColor: colors.dangerSubtle },
            ]}
            onPress={handleDelete}
          >
            <Text style={[styles.deleteText, { color: colors.danger }]}>
              Delete App
            </Text>
          </Pressable>
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
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
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
