export interface UserData {
  id: string;
  email: string;
  plan: "free" | "pro";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_interval: "month" | "year" | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface Dashboard {
  id: string;
  name: string;
  url: string;
  webhook_token: string | null;
  user_id: string;
  icon: string | null;
  accent_color: string | null;
  custom_icon_url: string | null;
  custom_app_name: string | null;
  background_color: string | null;
  heartbeat_interval_minutes: number | null;
  heartbeat_last_seen_at: string | null;
  heartbeat_alerted_at: string | null;
}

export interface DashboardWithSharing extends Dashboard {
  is_owner: boolean;
  owner_email?: string;
  member_role?: "viewer" | "editor" | null;
  can_send_notifications: boolean;
}

export interface DashboardMember {
  id: string;
  email: string;
  role: "viewer" | "editor";
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

export interface NotificationRecord {
  id: string;
  app_id: string | null;
  title: string;
  body: string | null;
  created_at: string;
  read_at: string | null;
  event_type: string | null;
  severity: "info" | "warning" | "critical" | null;
  channel: string | null;
  pushed_count: number | null;
  actions_json: Array<{ label: string; url: string; style?: string }> | null;
}

export interface DeviceRecord {
  id: string;
  platform: 'ios' | 'android';
  created_at: string;
  updated_at: string;
}

export interface DashboardTestResult {
  id: string;
  status: "success" | "error";
}
