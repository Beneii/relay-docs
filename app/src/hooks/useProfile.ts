import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import type { ProfileRow } from "@/types/database";

const PROFILE_KEY = ["profile"] as const;

export function useProfile() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: async (): Promise<ProfileRow | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data as ProfileRow;
    },
    enabled: !!user,
  });
}

export const FREE_LIMITS = {
  dashboards: 3,
  devices: 1,
  notificationsPerMonth: 100,
} as const;

export const PRO_LIMITS = {
  dashboards: Infinity,
  devices: 10,
  notificationsPerMonth: 10_000,
} as const;

export function getLimits(plan: "free" | "pro") {
  return plan === "pro" ? PRO_LIMITS : FREE_LIMITS;
}
