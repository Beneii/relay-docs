import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";
import { RelayLogo } from "@/components/RelayLogo";
import { useTheme, spacing, fontSizes, radii } from "@/theme";

type AuthMode = "login" | "signup";

export default function AuthScreen() {
  const { colors } = useTheme();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const authCallbackUrl = Linking.createURL("auth-callback");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPassword = password.length >= 8;
  const passwordsMatch = password === confirmPassword;

  const canSubmit =
    mode === "login"
      ? isValidEmail && password.length > 0
      : isValidEmail && isValidPassword && passwordsMatch;

  async function handleEmailAuth() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResetMessage("");

    const trimmedEmail = email.trim().toLowerCase();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (error) {
        if (error.message === "Email not confirmed") {
          setError("Please check your email and confirm your account first.");
        } else {
          setError(error.message);
        }
        setLoading(false);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: authCallbackUrl,
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setShowConfirmation(true);
        setLoading(false);
      }
    }
  }

  async function handleOAuth(provider: "github" | "google") {
    setError("");
    setResetMessage("");
    const redirectTo = Platform.select({
      web: typeof window !== "undefined" ? window.location.origin : "",
      default: Linking.createURL("auth-callback"),
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: Platform.OS !== "web",
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    // On native, open the OAuth URL in an in-app browser
    if (Platform.OS !== "web" && data?.url) {
      await WebBrowser.openAuthSessionAsync(data.url, redirectTo!);
    }
  }

  async function handleForgotPassword() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Enter your email address first to reset your password.");
      setResetMessage("");
      return;
    }

    setResetLoading(true);
    setError("");
    setResetMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: authCallbackUrl,
    });

    if (error) {
      setError(error.message);
      setResetLoading(false);
      return;
    }

    setResetMessage("If an account exists for that email, we sent a reset link.");
    setResetLoading(false);
  }

  function toggleMode() {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
    setResetMessage("");
    setPassword("");
    setConfirmPassword("");
    setShowConfirmation(false);
  }

  if (showConfirmation) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.inner}>
          <View style={styles.confirmContainer}>
            <View
              style={[
                styles.confirmIcon,
                { backgroundColor: colors.accentSubtle },
              ]}
            >
              <Feather name="mail" size={28} color={colors.accent} />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>
              Check your email
            </Text>
            <Text style={[styles.confirmBody, { color: colors.textSecondary }]}>
              We sent a confirmation link to{"\n"}
              <Text style={{ color: colors.accent, fontWeight: "600" }}>
                {email.trim()}
              </Text>
            </Text>
            <Text
              style={[styles.confirmHint, { color: colors.textTertiary }]}
            >
              Confirm your email, then come back and sign in.
            </Text>
            <Pressable
              style={[styles.confirmButton, { backgroundColor: colors.accent }]}
              onPress={() => {
                setShowConfirmation(false);
                setMode("login");
                setPassword("");
                setConfirmPassword("");
              }}
            >
              <Text style={styles.confirmButtonText}>Back to Sign in</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brandSection}>
            <View style={{ marginBottom: spacing.sm }}>
              <RelayLogo size={44} color={colors.textPrimary} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {mode === "login" ? "Sign in to Relay" : "Create your account"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Your dashboards, one tap away.
            </Text>
          </View>

          {/* OAuth buttons */}
          <View style={styles.oauthSection}>
            <Pressable
              style={[
                styles.oauthButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleOAuth("google")}
            >
              <Feather name="chrome" size={18} color={colors.textPrimary} />
              <Text
                style={[styles.oauthButtonText, { color: colors.textPrimary }]}
              >
                Continue with Google
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.oauthButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleOAuth("github")}
            >
              <Feather name="github" size={18} color={colors.textPrimary} />
              <Text
                style={[styles.oauthButtonText, { color: colors.textPrimary }]}
              >
                Continue with GitHub
              </Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>
              or
            </Text>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
          </View>

          {/* Email/password form */}
          <View style={styles.form}>
            {error ? (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: colors.dangerSubtle, borderColor: colors.danger + "30" },
                ]}
              >
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            {resetMessage ? (
              <View
                style={[
                  styles.successBox,
                  {
                    backgroundColor: colors.successSubtle,
                    borderColor: colors.success + "30",
                  },
                ]}
              >
                <Text style={[styles.successText, { color: colors.success }]}>
                  {resetMessage}
                </Text>
              </View>
            ) : null}

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Email
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
              placeholder="you@example.com"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!loading}
            />

            <View style={[styles.passwordHeader, { marginTop: spacing.md }]}> 
              <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>
                Password
              </Text>
              {mode === "login" ? (
                <Pressable onPress={handleForgotPassword} disabled={resetLoading || loading}>
                  <Text
                    style={[
                      styles.forgotPasswordText,
                      {
                        color:
                          resetLoading || loading ? colors.textTertiary : colors.accent,
                      },
                    ]}
                  >
                    {resetLoading ? "Sending..." : "Forgot password?"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder={mode === "signup" ? "At least 8 characters" : ""}
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              returnKeyType={mode === "login" ? "go" : "next"}
              onSubmitEditing={mode === "login" ? handleEmailAuth : undefined}
            />

            {mode === "signup" ? (
              <>
                <Text
                  style={[
                    styles.label,
                    { color: colors.textSecondary, marginTop: spacing.md },
                  ]}
                >
                  Confirm password
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      color: colors.textPrimary,
                      borderColor:
                        confirmPassword.length > 0 && !passwordsMatch
                          ? colors.danger
                          : colors.border,
                    },
                  ]}
                  placeholder=""
                  placeholderTextColor={colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!loading}
                  returnKeyType="go"
                  onSubmitEditing={handleEmailAuth}
                />
              </>
            ) : null}

            <Pressable
              style={[
                styles.submitButton,
                {
                  backgroundColor: canSubmit ? colors.accent : colors.surface,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
              onPress={handleEmailAuth}
              disabled={!canSubmit || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text
                  style={[
                    styles.submitButtonText,
                    { color: canSubmit ? "#FFFFFF" : colors.textTertiary },
                  ]}
                >
                  {mode === "login" ? "Sign in" : "Create account"}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Toggle login/signup */}
          <View style={styles.toggleSection}>
            <View
              style={[styles.toggleDivider, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
              {mode === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <Text
                style={{ color: colors.accent, fontWeight: "600" }}
                onPress={toggleMode}
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  brandSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: "700",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSizes.md,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  oauthSection: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  oauthButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm + 2,
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  oauthButtonText: {
    fontSize: fontSizes.md,
    fontWeight: "500",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: fontSizes.sm,
  },
  form: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: "500",
    marginBottom: 6,
  },
  passwordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  forgotPasswordText: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
  },
  input: {
    height: 48,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.md,
    borderWidth: 1,
  },
  submitButton: {
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  submitButtonText: {
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
  errorBox: {
    padding: spacing.sm + 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: fontSizes.sm,
  },
  successBox: {
    padding: spacing.sm + 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: fontSizes.sm,
  },
  toggleSection: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  toggleDivider: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  toggleText: {
    fontSize: fontSizes.sm,
  },
  confirmContainer: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  confirmTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "600",
  },
  confirmBody: {
    fontSize: fontSizes.md,
    textAlign: "center",
    lineHeight: 22,
  },
  confirmHint: {
    fontSize: fontSizes.sm,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  confirmButton: {
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
  },
});
