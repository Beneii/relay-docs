import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview";
import { useAuthStore } from "@/stores/authStore";
import { useApp, useUpdateLastOpened } from "@/hooks/useApps";
import { AppIcon } from "@/components/AppIcon";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Feather } from "@expo/vector-icons";
import { useTheme, spacing, fontSizes, radii } from "@/theme";

export default function AppWebViewScreen() {
  const session = useAuthStore((s) => s.session);
  const { colors } = useTheme();
  const { id, path } = useLocalSearchParams<{ id: string; path?: string }>();
  const { data: app, isLoading, error } = useApp(id ?? "");
  const updateLastOpened = useUpdateLastOpened();
  const webviewUrl =
    path && app?.url
      ? app.url.replace(/\/+$/, "") + (path.startsWith("/") ? path : `/${path}`)
      : app?.url;

  const webViewRef = useRef<WebView>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const hasUpdatedLastOpened = useRef(false);

  const handleLoadStart = useCallback(() => {
    setIsPageLoading(true);
    setLoadError(null);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsPageLoading(false);
    if (app?.is_owner && !hasUpdatedLastOpened.current) {
      hasUpdatedLastOpened.current = true;
      updateLastOpened.mutate(app.id);
    }
  }, [app, updateLastOpened]);

  const handleLoadError = useCallback(() => {
    setIsPageLoading(false);
    setLoadError("Failed to load this page. Check the URL and your connection.");
  }, []);

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      setCanGoBack(navState.canGoBack);
      setCanGoForward(navState.canGoForward);

      if (!app || !webviewUrl) return;
      try {
        const appOrigin = new URL(webviewUrl).origin;
        const navOrigin = new URL(navState.url).origin;
        if (navOrigin !== appOrigin && navState.navigationType === "click") {
          webViewRef.current?.stopLoading();
          Linking.openURL(navState.url);
        }
      } catch {
        // ignore parse errors
      }
    },
    [app, webviewUrl]
  );

  function handleRefresh() {
    setShowMenu(false);
    webViewRef.current?.reload();
  }

  function handleOpenExternal() {
    setShowMenu(false);
    if (webviewUrl) {
      if (app?.is_owner && !hasUpdatedLastOpened.current) {
        hasUpdatedLastOpened.current = true;
        updateLastOpened.mutate(app.id);
      }
      Linking.openURL(webviewUrl);
    }
  }

  function handleEdit() {
    setShowMenu(false);
    if (app) router.push({ pathname: "/edit-app", params: { id: app.id } });
  }

  function handleExit() {
    router.back();
  }

  if (!session) return <Redirect href="/auth" />;

  if (isLoading) return <LoadingScreen />;

  if (error || !app) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {error ? "Failed to load app" : "App not found"}
          </Text>
          <Pressable
            style={[styles.errorButton, { backgroundColor: colors.surface }]}
            onPress={() => router.back()}
          >
            <Text style={{ color: colors.accent, fontSize: fontSizes.md }}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const accentBg = app.accent_color ?? colors.surface;
  const appDisplayName = app.custom_app_name || app.name;

  async function handleCopyUrl() {
    if (!webviewUrl) return;
    await Clipboard.setStringAsync(webviewUrl);
  }

  if (Platform.OS === "web") {
    return (
      <SafeAreaView
        edges={["top"]}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.brandedHeader,
            {
              backgroundColor: accentBg + "22",
              borderBottomColor: accentBg + "44",
            },
          ]}
        >
          <AppIcon
            icon={app.icon}
            accentColor={app.accent_color}
            customIconUrl={app.custom_icon_url}
            backgroundColor={app.background_color}
            size={28}
          />
          <Text
            style={[
              styles.brandedHeaderTitle,
              { color: app.accent_color ?? colors.textPrimary },
            ]}
            numberOfLines={1}
          >
            {appDisplayName}
          </Text>
          <Pressable
            onPress={handleExit}
            style={styles.brandedHeaderClose}
            hitSlop={8}
          >
            <Feather
              name="x"
              size={18}
              color={app.accent_color ?? colors.textSecondary}
            />
          </Pressable>
        </View>

        <View style={styles.webSummaryContainer}>
          <View
            style={[
              styles.webSummaryCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.webSummaryIcon}>
              <AppIcon
                icon={app.icon}
                accentColor={app.accent_color}
                customIconUrl={app.custom_icon_url}
                backgroundColor={app.background_color}
                size={56}
              />
            </View>
            <Text
              style={[styles.webSummaryTitle, { color: colors.textPrimary }]}
            >
              {appDisplayName}
            </Text>
            <Text
              style={[styles.webSummaryBody, { color: colors.textSecondary }]}
            >
              The web preview stays inside Relay now. Open the dashboard only when
              you want to leave the app shell.
            </Text>
            <Text
              style={[styles.webSummaryUrl, { color: colors.textTertiary }]}
              numberOfLines={2}
            >
              {webviewUrl ?? app.url}
            </Text>

            <View style={styles.webActionRow}>
              <Pressable
                style={[
                  styles.webPrimaryButton,
                  { backgroundColor: colors.accent },
                ]}
                onPress={handleOpenExternal}
              >
                <Feather name="external-link" size={16} color="#FFFFFF" />
                <Text style={styles.webPrimaryButtonText}>Open dashboard</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.webSecondaryButton,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
                onPress={handleCopyUrl}
              >
                <Feather name="copy" size={16} color={colors.textPrimary} />
                <Text
                  style={[
                    styles.webSecondaryButtonText,
                    { color: colors.textPrimary },
                  ]}
                >
                  Copy URL
                </Text>
              </Pressable>
            </View>

            {app.is_owner ? (
              <Pressable
                style={[
                  styles.webSecondaryButton,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                    alignSelf: "stretch",
                  },
                ]}
                onPress={handleEdit}
              >
                <Feather name="edit-2" size={16} color={colors.textPrimary} />
                <Text
                  style={[
                    styles.webSecondaryButtonText,
                    { color: colors.textPrimary },
                  ]}
                >
                  Edit dashboard
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Branded header */}
      <View style={[styles.brandedHeader, { backgroundColor: accentBg + "22", borderBottomColor: accentBg + "44" }]}>
        <AppIcon icon={app.icon} accentColor={app.accent_color} customIconUrl={app.custom_icon_url} backgroundColor={app.background_color} size={28} />
        <Text style={[styles.brandedHeaderTitle, { color: app.accent_color ?? colors.textPrimary }]} numberOfLines={1}>
          {appDisplayName}
        </Text>
        <Pressable onPress={handleExit} style={styles.brandedHeaderClose} hitSlop={8}>
          <Feather name="x" size={18} color={app.accent_color ?? colors.textSecondary} />
        </Pressable>
      </View>

      {/* Loading bar */}
      {isPageLoading ? (
        <View style={[styles.loadingBar, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.accent} size="small" />
        </View>
      ) : null}

      {/* Error state */}
      {loadError ? (
        <View style={styles.errorContainer}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.dangerSubtle, alignItems: "center", justifyContent: "center", marginBottom: spacing.md }}>
            <Feather name="alert-triangle" size={28} color={colors.danger} />
          </View>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {loadError}
          </Text>
          <Pressable
            style={[styles.errorButton, { backgroundColor: colors.surface }]}
            onPress={() => {
              setLoadError(null);
              setIsPageLoading(true);
              webViewRef.current?.reload();
            }}
          >
            <Text style={{ color: colors.accent, fontSize: fontSizes.md }}>
              Retry
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: webviewUrl ?? "" }}
        style={[styles.webview, loadError ? styles.hidden : null]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleLoadError}
        onHttpError={handleLoadError}
        onNavigationStateChange={handleNavigationStateChange}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={false}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        allowsBackForwardNavigationGestures
        pullToRefreshEnabled
        mediaCapturePermissionGrantType="prompt"
      />

      {/* Menu overlay */}
      {showMenu ? (
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setShowMenu(false)}
        >
          <SafeAreaView edges={["bottom"]} style={styles.menuPositioner}>
            <View
              style={[
                styles.menu,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
            >
              <Pressable style={styles.menuItem} onPress={handleRefresh}>
                <Feather name="refresh-cw" size={16} color={colors.textSecondary} />
                <Text style={{ color: colors.textPrimary, fontSize: fontSizes.md }}>
                  Refresh
                </Text>
              </Pressable>
              <Pressable style={styles.menuItem} onPress={handleOpenExternal}>
                <Feather name="external-link" size={16} color={colors.textSecondary} />
                <Text style={{ color: colors.textPrimary, fontSize: fontSizes.md }}>
                  Open in Browser
                </Text>
              </Pressable>
              {app.is_owner ? (
                <Pressable style={styles.menuItem} onPress={handleEdit}>
                  <Feather name="edit-2" size={16} color={colors.textSecondary} />
                  <Text style={{ color: colors.textPrimary, fontSize: fontSizes.md }}>
                    Edit App
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </SafeAreaView>
        </Pressable>
      ) : null}

      {/* Floating controls */}
      <SafeAreaView edges={["bottom"]} style={styles.fabContainer} pointerEvents="box-none">
        <View style={styles.fabRow}>
          {canGoBack ? (
            <Pressable
              style={[styles.fabSecondary, { backgroundColor: colors.surfaceElevated + "EE", borderColor: colors.border }]}
              onPress={() => webViewRef.current?.goBack()}
            >
              <Feather name="chevron-left" size={18} color={colors.textPrimary} />
            </Pressable>
          ) : null}
          {canGoForward ? (
            <Pressable
              style={[styles.fabSecondary, { backgroundColor: colors.surfaceElevated + "EE", borderColor: colors.border }]}
              onPress={() => webViewRef.current?.goForward()}
            >
              <Feather name="chevron-right" size={18} color={colors.textPrimary} />
            </Pressable>
          ) : null}
          <Pressable
            style={[styles.fabSecondary, { backgroundColor: colors.surfaceElevated + "EE", borderColor: colors.border }]}
            onPress={() => setShowMenu(!showMenu)}
          >
            <Feather name="more-horizontal" size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            style={[styles.fab, { backgroundColor: colors.surfaceElevated + "EE", borderColor: colors.border }]}
            onPress={handleExit}
          >
            <Feather name="x" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  brandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brandedHeaderTitle: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
  brandedHeaderClose: {
    padding: 4,
  },
  webview: {
    flex: 1,
  },
  hidden: {
    height: 0,
    flex: 0,
  },
  loadingBar: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSizes.md,
    textAlign: "center",
    lineHeight: 22,
  },
  errorButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  fabContainer: {
    position: "absolute",
    bottom: 0,
    right: spacing.md,
  },
  fabRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  fabSecondary: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 20,
  },
  menuPositioner: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingRight: spacing.md,
  },
  menu: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    minWidth: 180,
    marginBottom: 70,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  webSummaryContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  webSummaryCard: {
    width: "100%",
    maxWidth: 520,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
  },
  webSummaryIcon: {
    alignItems: "center",
  },
  webSummaryTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "700",
    textAlign: "center",
  },
  webSummaryBody: {
    fontSize: fontSizes.md,
    lineHeight: 22,
    textAlign: "center",
  },
  webSummaryUrl: {
    fontSize: fontSizes.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  webActionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  webPrimaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 46,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flex: 1,
  },
  webPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
  webSecondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 46,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    flex: 1,
  },
  webSecondaryButtonText: {
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
});
