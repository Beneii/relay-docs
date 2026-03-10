export interface RelayConfig {
  token: string;
  endpoint?: string;
}

export interface RelayAction {
  /** Button label shown on the notification. Max 50 chars. */
  label: string;
  /** HTTPS URL to POST to when user taps this action. */
  url: string;
  /** Visual style. "destructive" renders red on iOS. Default: "default". */
  style?: "default" | "destructive";
}

export type RelaySeverity = "info" | "warning" | "critical";

export interface NotifyOptions {
  title: string;
  body?: string;
  eventType?: string;
  metadata?: Record<string, unknown>;
  /** Deep link path within the dashboard to open on notification tap. e.g. "/trades/latest" */
  url?: string;
  actions?: RelayAction[];
  severity?: RelaySeverity;
  channel?: string;
}

export interface RelayRequestBody {
  title: string;
  body?: string;
  eventType?: string;
  metadata?: Record<string, unknown>;
  url?: string;
  actions?: RelayAction[];
  severity?: RelaySeverity;
  channel?: string;
}

export interface NotifyResponse {
  success: boolean;
  notificationId: string;
  pushed: number;
  signature?: string;
}
