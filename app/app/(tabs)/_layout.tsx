import React, { useEffect } from "react";
import { Tabs, Redirect, router } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useTheme, radii } from "@/theme";

function TabIcon({
  iconName,
  focused,
  badge,
}: {
  iconName: keyof typeof Feather.glyphMap;
  focused: boolean;
  badge?: number;
}) {
  const { colors } = useTheme();

  return (
    <View style={tabStyles.iconContainer}>
      <View>
        <Feather
          name={iconName}
          size={24}
          color={focused ? colors.accent : colors.textTertiary}
        />
        {badge && badge > 0 ? (
          <View
            style={[tabStyles.badge, { backgroundColor: colors.danger }]}
          >
            <Text style={tabStyles.badgeText}>
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const session = useAuthStore((s) => s.session);
  const { colors } = useTheme();
  const { data: unreadCount } = useUnreadCount();
  const { pendingAppId, pendingPath, setPendingAppId, clearPendingPath } =
    useNavigationStore();

  // Handle cold-start navigation from push notification
  useEffect(() => {
    if (pendingAppId) {
      const id = pendingAppId;
      const path = pendingPath;
      setPendingAppId(null);
      clearPendingPath();
      setTimeout(() => {
        if (path) {
          router.push({ pathname: "/app/[id]", params: { id, path } });
        } else {
          router.push({ pathname: "/app/[id]", params: { id } });
        }
      }, 100);
    }
  }, [clearPendingPath, pendingAppId, pendingPath, setPendingAppId]);

  if (!session) {
    return <Redirect href="/auth" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 88,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="grid" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              iconName="bell"
              focused={focused}
              badge={unreadCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
