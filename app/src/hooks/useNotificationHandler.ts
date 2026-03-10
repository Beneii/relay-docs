import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Crypto from "expo-crypto";
import { router } from "expo-router";
import { useNavigationStore } from "@/stores/navigationStore";

// Configure how notifications appear when the app is in the foreground
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data;
      const severity = data?.severity as string | undefined;
      return {
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: severity === "critical" || severity === "warning",
        shouldSetBadge: true,
      };
    },
  });
}

/**
 * Handles notification interactions (taps) and routes to the correct app.
 * Also handles cold start from notification via last notification response.
 */
export function useNotificationHandler() {
  const setPendingAppId = useNavigationStore((s) => s.setPendingAppId);
  const setPendingPath = useNavigationStore((s) => s.setPendingPath);

  useEffect(() => {
    if (Platform.OS === "web") return;

    // Handle notification tap while app is open/backgrounded
    const subscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data = response.notification.request.content.data;
        const appId = data?.appId as string | undefined;
        const deepLinkUrl = data?.deepLinkUrl as string | undefined;
        const actions = data?.actions as Array<{ label: string; url: string; style?: string }> | undefined;
        const callbackToken = data?.callbackToken as string | undefined;
        const actionIdentifier = response.actionIdentifier;

        if (actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER && actions) {
          const actionIndex = parseInt(actionIdentifier.replace("action_", ""), 10);
          const action = !Number.isNaN(actionIndex) ? actions[actionIndex] : undefined;
          if (action?.url) {
            const payload = {
              notificationId: data?.notificationId,
              actionLabel: action.label,
              actionIndex,
            };
            const body = JSON.stringify(payload);
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (callbackToken) {
              try {
                const sig = await Crypto.digestStringAsync(
                  Crypto.CryptoDigestAlgorithm.SHA256,
                  callbackToken + body
                );
                headers["x-relay-signature"] = `sha256=${sig}`;
              } catch {
                // ignore
              }
            }
            fetch(action.url, {
              method: "POST",
              headers,
              body,
            }).catch(() => {
              // Ignore failure — action endpoint may be offline
            });
          }
          return;
        }

        if (appId) {
          if (deepLinkUrl) {
            router.push({ pathname: "/app/[id]", params: { id: appId, path: deepLinkUrl } });
          } else {
            router.push({ pathname: "/app/[id]", params: { id: appId } });
          }
        }
      }
    );

    // Handle cold start: check if the app was opened from a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        const appId = data?.appId as string | undefined;
        const deepLinkUrl = data?.deepLinkUrl as string | undefined;
        if (appId) {
          setPendingAppId(appId);
          if (deepLinkUrl) {
            setPendingPath(deepLinkUrl);
          }
        }
      }
    });

    return () => subscription.remove();
  }, [setPendingAppId, setPendingPath]);
}
