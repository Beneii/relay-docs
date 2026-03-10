export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          plan: "free" | "pro";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          billing_interval: "month" | "year" | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          welcome_email_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          plan?: "free" | "pro";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          billing_interval?: "month" | "year" | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          welcome_email_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          plan?: "free" | "pro";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          billing_interval?: "month" | "year" | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          welcome_email_sent?: boolean;
          updated_at?: string;
        };
      };
      apps: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          url: string;
          icon: string | null;
          accent_color: string | null;
          notifications_enabled: boolean;
          webhook_token: string;
          heartbeat_interval_minutes: number | null;
          heartbeat_last_seen_at: string | null;
          heartbeat_alerted_at: string | null;
          created_at: string;
          updated_at: string;
          last_opened_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          url: string;
          icon?: string | null;
          accent_color?: string | null;
          notifications_enabled?: boolean;
          webhook_token: string;
          heartbeat_interval_minutes?: number | null;
          heartbeat_last_seen_at?: string | null;
          heartbeat_alerted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          last_opened_at?: string | null;
        };
        Update: {
          name?: string;
          url?: string;
          icon?: string | null;
          accent_color?: string | null;
          notifications_enabled?: boolean;
          heartbeat_interval_minutes?: number | null;
          heartbeat_last_seen_at?: string | null;
          heartbeat_alerted_at?: string | null;
          updated_at?: string;
          last_opened_at?: string | null;
        };
      };
      devices: {
        Row: {
          id: string;
          user_id: string;
          expo_push_token: string;
          platform: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          expo_push_token: string;
          platform: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          expo_push_token?: string;
          platform?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          app_id: string;
          title: string;
          body: string | null;
          event_type: string | null;
          metadata_json: Record<string, unknown> | null;
          severity: "info" | "warning" | "critical" | null;
          channel: string | null;
          pushed_count: number | null;
          actions_json: Array<{ label: string; url: string; style?: string }> | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          app_id: string;
          title: string;
          body?: string | null;
          event_type?: string | null;
          metadata_json?: Record<string, unknown> | null;
          severity?: "info" | "warning" | "critical" | null;
          channel?: string | null;
          pushed_count?: number | null;
          actions_json?: Array<{ label: string; url: string; style?: string }> | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type AppRow = Tables<"apps">;
export type NotificationRow = Tables<"notifications">;
export type DeviceRow = Tables<"devices">;
export type ProfileRow = Tables<"profiles">;
