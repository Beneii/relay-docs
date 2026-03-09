export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          plan: "free" | "pro";
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          plan?: "free" | "pro";
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          plan?: "free" | "pro";
          stripe_customer_id?: string | null;
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
