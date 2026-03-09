import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import type { NotificationRow } from "@/types/database";

const NOTIFICATIONS_KEY = ["notifications"] as const;

export function useNotifications() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async (): Promise<NotificationRow[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data as NotificationRow[]) ?? [];
    },
    enabled: !!user,
    refetchOnMount: "always",
    staleTime: 5_000,
  });
}

export function useUnreadCount() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, "unread_count"],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    refetchOnMount: "always",
    staleTime: 5_000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

/**
 * Returns the count of notifications received in the current calendar month.
 */
export function useMonthlyNotificationCount() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, "monthly_count"],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

/**
 * Returns the most recent notification for each app, keyed by app_id.
 */
export function useLatestNotificationByApp() {
  const { data: notifications } = useNotifications();

  const map = new Map<string, NotificationRow>();
  if (notifications) {
    for (const n of notifications) {
      if (!map.has(n.app_id)) {
        map.set(n.app_id, n);
      }
    }
  }

  return map;
}
