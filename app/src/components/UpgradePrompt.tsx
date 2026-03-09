import React from "react";
import { View, Text, Pressable, StyleSheet, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme, spacing, fontSizes, radii } from "@/theme";
import { supabase } from "@/lib/supabase";
import { PRO_LIMITS } from "@shared/product";

interface UpgradePromptProps {
  title?: string;
  message: string;
  compact?: boolean;
}

export function UpgradePrompt({
  title = "Upgrade to Pro",
  message,
  compact = false,
}: UpgradePromptProps) {
  const { colors } = useTheme();

  function handleUpgrade() {
    openUpgradeWithSession("/pricing");
  }

  if (compact) {
    return (
      <Pressable
        style={[
          styles.compactContainer,
          { backgroundColor: colors.accentSubtle, borderColor: colors.accent + "30" },
        ]}
        onPress={handleUpgrade}
      >
        <Feather name="zap" size={16} color={colors.accent} />
        <Text
          style={[styles.compactText, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {message}
        </Text>
        <Feather name="external-link" size={14} color={colors.accent} />
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View
        style={[styles.iconCircle, { backgroundColor: colors.accentSubtle }]}
      >
        <Feather name="zap" size={22} color={colors.accent} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
      <View style={styles.features}>
        {[
          "Unlimited dashboards",
          `Up to ${PRO_LIMITS.devices} devices`,
          `${PRO_LIMITS.notificationsPerMonth.toLocaleString()} notifications/mo`,
        ].map(
          (feature) => (
            <View key={feature} style={styles.featureRow}>
              <Feather name="check" size={14} color={colors.accent} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                {feature}
              </Text>
            </View>
          )
        )}
      </View>
      <Pressable
        style={[styles.upgradeButton, { backgroundColor: colors.accent }]}
        onPress={handleUpgrade}
      >
        <Text style={styles.upgradeButtonText}>Upgrade — $7.99/mo</Text>
        <Feather name="external-link" size={14} color="#FFFFFF" />
      </Pressable>
      <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
        Opens relayapp.dev in your browser
      </Text>
    </View>
  );
}

/**
 * Opens the website with the user's current session tokens in the URL hash.
 * The website's /auth/callback route picks up the tokens, sets the session,
 * and redirects — so the user is instantly signed in without re-entering
 * credentials.
 */
export async function openUpgradeWithSession(redirect: string = "/pricing") {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  if (session?.access_token && session?.refresh_token) {
    // Use hash fragment instead of query params to prevent token
    // leakage via Referrer headers to third-party services.
    const params = new URLSearchParams({
      t: session.access_token,
      r: session.refresh_token,
      to: redirect,
    }).toString();
    Linking.openURL(`https://relayapp.dev/auth/callback#${params}`);
  } else {
    // Fallback: just open pricing (user will need to log in)
    Linking.openURL(`https://relayapp.dev${redirect}`);
  }
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: "700",
  },
  message: {
    fontSize: fontSizes.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  features: {
    gap: spacing.xs + 2,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  featureText: {
    fontSize: fontSizes.sm,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 44,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    width: "100%",
    marginTop: spacing.xs,
  },
  upgradeButtonText: {
    color: "#FFFFFF",
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
  disclaimer: {
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  compactText: {
    fontSize: fontSizes.sm,
    fontWeight: "500",
    flex: 1,
  },
});
