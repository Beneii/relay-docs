import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useAuthStore } from "@/stores/authStore";

/**
 * Registers for Expo Push Notifications and stores the token in the backend.
 * Deregisters the token on sign-out.
 */
export function usePushRegistration() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const registered = useRef(false);
  const lastToken = useRef<string | null>(null);
  const lastUserId = useRef<string | null>(null);

  // Reset registration state on sign-out.
  // Note: Actual device row deletion happens in settings.tsx handleSignOut
  // BEFORE calling supabase.auth.signOut(), because after signOut the client
  // has no auth session and RLS would reject the delete.
  useEffect(() => {
    if (user) {
      lastUserId.current = user.id;
      return;
    }

    // user went null — clean up local refs
    registered.current = false;
    lastToken.current = null;
    lastUserId.current = null;
  }, [user]);

  // Register on sign-in
  useEffect(() => {
    if (!user || !session?.access_token || registered.current || Platform.OS === "web") {
      return;
    }

    const accessToken = session.access_token;

    async function register() {
      if (!Device.isDevice) {
        console.warn("Push notifications require a physical device");
        return;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Push notification permission denied");
        return;
      }

      // Get the Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId || projectId === "YOUR_EAS_PROJECT_ID") {
        console.warn("EAS project ID not configured — cannot register push token");
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const expoPushToken = tokenData.data;

      // Configure Android notification channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      const supabaseUrl =
        Constants.expoConfig?.extra?.supabaseUrl ??
        process.env.EXPO_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl || supabaseUrl.includes("YOUR_")) {
        console.warn("Supabase URL not configured — cannot register push token");
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/register-device`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          expoPushToken,
          platform: Platform.OS as "ios" | "android",
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        console.error(
          "Failed to register push token:",
          errorPayload?.error || `HTTP ${response.status}`
        );
        return;
      }

      registered.current = true;
      lastToken.current = expoPushToken;
    }

    register().catch(console.error);
  }, [session?.access_token, user]);
}
