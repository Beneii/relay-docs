import React from "react";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function AuthCallbackScreen() {
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);

  if (!initialized) {
    return <LoadingScreen />;
  }

  return <Redirect href={session ? "/(tabs)" : "/auth"} />;
}
