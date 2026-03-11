import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import type { NotificationRow } from "@/types/database";

const PAGE_SIZE = 30;
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

export function usePaginatedNotifications() {
  const user = useAuthStore((s) => s.user);
  const [pages, setPages] = useState<NotificationRow[][]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (afterCursor: string | null, reset = false) => {
    if (!user) return;
    setLoading(true);
    try {
      setError(null);
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (afterCursor) {
        query = query.lt("created_at", afterCursor);
      }

      const { data, error } = await query;
      if (error) throw error;
      const rows = (data as NotificationRow[]) ?? [];

      if (reset) {
        setPages([rows]);
      } else {
        setPages((prev) => [...prev, rows]);
      }

      setHasMore(rows.length === PAGE_SIZE);
      if (rows.length > 0) {
        setCursor(rows[rows.length - 1].created_at);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setCursor(null);
    await fetchPage(null, true);
    setRefreshing(false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPage(cursor);
    }
  }, [cursor, fetchPage, hasMore, loading]);

  const notifications = pages.flat();

  return { notifications, loading, refreshing, hasMore, refresh, loadMore, fetchPage, error };
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
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      const previous = queryClient.getQueryData<NotificationRow[]>(NOTIFICATIONS_KEY);
      if (previous) {
        queryClient.setQueryData<NotificationRow[]>(NOTIFICATIONS_KEY, (old) =>
          old?.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)) ?? []
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_KEY, context.previous);
      }
    },
    onSettled: () => {
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
