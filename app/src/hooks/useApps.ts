import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { generateWebhookToken } from "@/utils/webhook";
import type { AppRow } from "@/types/database";

const APPS_KEY = ["apps"] as const;

export function useApps() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: APPS_KEY,
    queryFn: async (): Promise<AppRow[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("apps")
        .select("*")
        .eq("user_id", user.id)
        .order("last_opened_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return (data as AppRow[]) ?? [];
    },
    enabled: !!user,
  });
}

export function useApp(id: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["apps", id],
    queryFn: async (): Promise<AppRow | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("apps")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as AppRow;
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
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPS_KEY });
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
