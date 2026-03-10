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
  webhook_token: string;
  icon: string | null;
  heartbeat_interval_minutes: number | null;
  heartbeat_last_seen_at: string | null;
  heartbeat_alerted_at: string | null;
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
