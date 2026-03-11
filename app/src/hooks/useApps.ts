import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { generateWebhookToken } from "@/utils/webhook";
import type { AccessibleAppRow, AppRow } from "@/types/database";

const APPS_KEY = ["apps"] as const;

export function useApps() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: APPS_KEY,
    queryFn: async (): Promise<AccessibleAppRow[]> => {
      if (!user) return [];
      const { data, error } = await supabase.rpc("list_accessible_apps");

      if (error) throw error;
      return ((data as AccessibleAppRow[]) ?? []).sort((left, right) => {
        const leftTime = left.last_opened_at ? new Date(left.last_opened_at).getTime() : 0;
        const rightTime = right.last_opened_at ? new Date(right.last_opened_at).getTime() : 0;
        return rightTime - leftTime;
      });
    },
    enabled: !!user,
  });
}

export function useApp(id: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["apps", id],
    queryFn: async (): Promise<AccessibleAppRow | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .rpc("get_accessible_app", { p_app_id: id })
        .maybeSingle();

      if (error) throw error;
      return (data as AccessibleAppRow | null) ?? null;
    },
    enabled: !!user && !!id,
  });
}

interface CreateAppInput {
  name: string;
  url: string;
  icon?: string | null;
  accent_color?: string | null;
  notifications_enabled?: boolean;
  heartbeat_interval_minutes?: number | null;
  custom_icon_url?: string | null;
  custom_app_name?: string | null;
  background_color?: string | null;
}

export function useCreateApp() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: CreateAppInput) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("apps")
        .insert({
          ...input,
          user_id: user.id,
          webhook_token: generateWebhookToken(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as AppRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPS_KEY });
    },
  });
}

interface UpdateAppInput {
  name?: string;
  url?: string;
  icon?: string | null;
  accent_color?: string | null;
  notifications_enabled?: boolean;
  heartbeat_interval_minutes?: number | null;
  custom_icon_url?: string | null;
  custom_app_name?: string | null;
  background_color?: string | null;
}

export function useUpdateApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateAppInput }) => {
      const { data, error } = await supabase
        .from("apps")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as AppRow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: APPS_KEY });
      queryClient.invalidateQueries({ queryKey: ["apps", data.id] });
    },
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("apps").delete().eq("id", id);
      if (error) {
        if (error.code === "23503") {
          throw new Error("Cannot delete this dashboard until related access records are removed.");
        }
        throw error;
      }
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: APPS_KEY });
      queryClient.removeQueries({ queryKey: ["apps", id] });
    },
  });
}

export function useUpdateLastOpened() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("apps")
        .update({ last_opened_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPS_KEY });
    },
  });
}
