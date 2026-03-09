import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useNavigationStore } from "@/stores/navigationStore";

// Configure how notifications appear when the app is in the foreground
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Handles notification interactions (taps) and routes to the correct app.
 * Also handles cold start from notification via last notification response.
 */
export function useNotificationHandler() {
  const setPendingAppId = useNavigationStore((s) => s.setPendingAppId);

  useEffect(() => {
    if (Platform.OS === "web") return;

    // Handle notification tap while app is open/backgrounded
    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        const appId = data?.appId as string | undefined;

        if (appId) {
          router.push({ pathname: "/app/[id]", params: { id: appId } });
        }
      });

    // Handle cold start: check if the app was opened from a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        const appId = data?.appId as string | undefined;
        if (appId) {
          setPendingAppId(appId);
        }
      }
    });

    return () => subscription.remove();
  }, [setPendingAppId]);
}
