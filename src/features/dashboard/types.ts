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
}

export interface NotificationRecord {
  id: string;
  app_id: string | null;
  title: string;
  body: string | null;
  created_at: string;
  read_at: string | null;
  event_type: string | null;
}
