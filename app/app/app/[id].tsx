import React, { useState, useRef, useCallback, useEffect } from "react";
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

  if (!session) return <Redirect href="/auth" />;
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

  // On web, open in a new tab since iframes are blocked by most sites
  useEffect(() => {
    if (Platform.OS === "web" && webviewUrl) {
      window.open(webviewUrl, "_blank", "noopener");
      if (app && !hasUpdatedLastOpened.current) {
        hasUpdatedLastOpened.current = true;
        updateLastOpened.mutate(app.id);
      }
      router.back();
    }
  }, [app, updateLastOpened, webviewUrl]);

  const handleLoadStart = useCallback(() => {
    setIsPageLoading(true);
    setLoadError(null);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsPageLoading(false);
    if (app && !hasUpdatedLastOpened.current) {
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
    if (webviewUrl) Linking.openURL(webviewUrl);
  }

  function handleEdit() {
    setShowMenu(false);
    if (app) router.push({ pathname: "/edit-app", params: { id: app.id } });
  }

  function handleExit() {
    router.back();
  }

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
              <Pressable style={styles.menuItem} onPress={handleEdit}>
                <Feather name="edit-2" size={16} color={colors.textSecondary} />
                <Text style={{ color: colors.textPrimary, fontSize: fontSizes.md }}>
                  Edit App
                </Text>
              </Pressable>
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
});
