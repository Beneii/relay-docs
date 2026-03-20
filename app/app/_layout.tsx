import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useNotificationHandler } from "@/hooks/useNotificationHandler";
import { usePushRegistration } from "@/hooks/usePushRegistration";
import { useTheme } from "@/theme";
import { LoadingScreen } from "@/components/LoadingScreen";
import { OfflineBanner } from "@/components/OfflineBanner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

function RootLayoutInner() {
  const { colors, scheme } = useTheme();
  const { initialized, setSession, setInitialized } = useAuthStore();

  useNotificationHandler();
  usePushRegistration();

  useEffect(() => {
    // Restore session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      // Clear React Query cache on sign out to prevent data leaking between users
      if (!session) {
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setInitialized]);

  // Handle deep link auth callback (native: relay://auth-callback#access_token=...)
  useEffect(() => {
    if (Platform.OS === "web") return;

    function extractSessionFromUrl(url: string) {
      const hashIndex = url.indexOf("#");
      if (hashIndex === -1) return;
      const hash = url.substring(hashIndex + 1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
    }

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) extractSessionFromUrl(url);
    });

    // Listen for deep links while app is open
    const linkSubscription = Linking.addEventListener("url", ({ url }) => {
      extractSessionFromUrl(url);
    });

    return () => linkSubscription.remove();
  }, []);

  if (!initialized) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
          animationDuration: 250,
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    useSettingsStore
      .getState()
      .loadSettings()
      .then(() => setSettingsLoaded(true));
  }, []);

  if (!settingsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutInner />
    </QueryClientProvider>
  );
}
