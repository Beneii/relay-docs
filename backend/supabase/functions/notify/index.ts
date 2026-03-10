import { createClient } from "jsr:@supabase/supabase-js@2";
import { FREE_LIMITS, PRO_LIMITS } from "../../../shared/product.ts";

type RelaySeverity = "info" | "warning" | "critical";
type RelayActionStyle = "default" | "destructive";

interface RelayAction {
  label: string;
  url: string;
  style?: RelayActionStyle;
}

interface NotifyRequest {
  token: string;
  title: string;
  body?: string;
  eventType?: string;
  metadata?: Record<string, unknown>;
  actions?: RelayAction[];
  severity?: RelaySeverity;
  channel?: string;
  /** Deep link path within the dashboard to open on tap. e.g. "/trades/latest" */
  url?: string;
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const MAX_REQUEST_BYTES = 10 * 1024;
const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 2000;
const MAX_METADATA_BYTES = 4 * 1024;
const MAX_METADATA_DEPTH = 5;
const MAX_ACTIONS = 5;
const MAX_ACTION_LABEL_LENGTH = 50;
const MAX_CHANNEL_LENGTH = 32;
const ALLOWED_SEVERITIES: RelaySeverity[] = ["info", "warning", "critical"];
const ALLOWED_ACTION_STYLES: RelayActionStyle[] = ["default", "destructive"];

type RateLimitEntry = {
  count: number;
  windowStartedAt: number;
};

const ipRequestCounts = new Map<string, RateLimitEntry>();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function jsonResponse(
  payload: Record<string, unknown>,
  status: number,
  headers: HeadersInit = {}
) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, ...headers },
  });
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    if (firstIp?.trim()) {
      return firstIp.trim();
    }
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp?.trim()) {
    return realIp.trim();
  }

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp?.trim()) {
    return cfConnectingIp.trim();
  }

  return "unknown";
}

function cleanupRateLimitEntries(now: number) {
  for (const [ip, entry] of ipRequestCounts.entries()) {
    if (now - entry.windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
      ipRequestCounts.delete(ip);
    }
  }
}

function isRateLimited(ip: string) {
  const now = Date.now();

  cleanupRateLimitEntries(now);

  const currentEntry = ipRequestCounts.get(ip);
  if (!currentEntry || now - currentEntry.windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
    ipRequestCounts.set(ip, { count: 1, windowStartedAt: now });
    return false;
  }

  currentEntry.count += 1;
  ipRequestCounts.set(ip, currentEntry);

  return currentEntry.count > MAX_REQUESTS_PER_WINDOW;
}

function sanitizeText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

function getJsonDepth(value: unknown, current = 0): number {
  if (current >= MAX_METADATA_DEPTH + 1) return current;
  if (value !== null && typeof value === "object") {
    const entries = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>);
    if (entries.length === 0) return current + 1;
    return Math.max(...entries.map((v) => getJsonDepth(v, current + 1)));
  }
  return current;
}

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeSeverity(value: unknown): RelaySeverity {
  if (value === undefined || value === null) {
    return "info";
  }
  if (typeof value !== "string") {
    throw new Error("severity must be a string");
  }
  const normalized = value.trim().toLowerCase();
  if (!ALLOWED_SEVERITIES.includes(normalized as RelaySeverity)) {
    throw new Error("severity must be one of info, warning, or critical");
  }
  return normalized as RelaySeverity;
}

function sanitizeChannel(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw new Error("channel must be a string");
  }
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!normalized) {
    throw new Error("channel must contain alphanumeric characters");
  }
  if (normalized.length > MAX_CHANNEL_LENGTH) {
    throw new Error(`channel must be <= ${MAX_CHANNEL_LENGTH} characters`);
  }
  return normalized;
}

function validateActions(value: unknown): RelayAction[] | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (!Array.isArray(value)) {
    throw new Error("actions must be an array");
  }
  if (value.length === 0 || value.length > MAX_ACTIONS) {
    throw new Error(`actions must include between 1 and ${MAX_ACTIONS} entries`);
  }

  const labels = new Set<string>();
  return value.map((action, index) => {
    if (!action || typeof action !== "object" || Array.isArray(action)) {
      throw new Error(`action at index ${index} must be an object`);
    }

    const label = typeof action.label === "string" ? action.label.trim() : "";
    if (!label) {
      throw new Error(`action label at index ${index} is required`);
    }
    if (label.length > MAX_ACTION_LABEL_LENGTH) {
      throw new Error(`action label at index ${index} exceeds ${MAX_ACTION_LABEL_LENGTH} characters`);
    }

    const normalizedLabel = label.toLowerCase();
    if (labels.has(normalizedLabel)) {
      throw new Error("action labels must be unique");
    }
    labels.add(normalizedLabel);

    if (typeof action.url !== "string" || !isHttpsUrl(action.url.trim())) {
      throw new Error(`action url at index ${index} must be a valid https URL`);
    }

    let style: RelayActionStyle | undefined;
    if (action.style !== undefined) {
      if (typeof action.style !== "string") {
        throw new Error(`action style at index ${index} must be a string`);
      }
      const normalizedStyle = action.style.trim().toLowerCase();
      if (!ALLOWED_ACTION_STYLES.includes(normalizedStyle as RelayActionStyle)) {
        throw new Error(`action style at index ${index} must be default or destructive`);
      }
      style = normalizedStyle as RelayActionStyle;
    }

    return {
      label,
      url: action.url.trim(),
      ...(style ? { style } : {}),
    };
  });
}

function isInQuietHours(
  quietStart: string | null,
  quietEnd: string | null,
  utcOffsetMinutes: number,
  now: Date,
): boolean {
  if (!quietStart || !quietEnd) return false;
  const [sh, sm] = quietStart.split(":").map(Number);
  const [eh, em] = quietEnd.split(":").map(Number);
  // Convert UTC now to device local time
  const localMins = (now.getUTCHours() * 60 + now.getUTCMinutes() + utcOffsetMinutes + 1440) % 1440;
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  if (startMins <= endMins) return localMins >= startMins && localMins < endMins;
  return localMins >= startMins || localMins < endMins; // overnight wrap
}

async function generateSignature(token: string, payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(token),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sha256=${signatureHex}`;
}

async function sendQuotaEmail(
  to: string,
  subject: string,
  heading: string,
  message: string,
) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return;

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:40px 20px;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:40px;">
<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#18181b;">${heading}</h1>
<p style="margin:0 0 16px;font-size:15px;color:#71717a;line-height:1.6;">${message}</p>
<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td>
<a href="https://relayapp.dev/pricing" style="display:inline-block;background-color:#10B981;color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">Upgrade to Pro</a>
</td></tr></table>
</td></tr>
<tr><td align="center" style="padding-top:24px;">
<p style="margin:0;font-size:13px;color:#a1a1aa;">Relay — Real-time webhook notifications</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: "Relay <hello@relayapp.dev>",
      to,
      subject,
      html,
      text: `${heading} — ${message} Upgrade at https://relayapp.dev/pricing`,
    }),
  });
}

// deno-lint-ignore no-explicit-any
async function checkQuotaWarning(
  supabase: any,
  userId: string,
  used: number,
  limit: number,
  plan: string,
) {
  if (plan === "pro") return;

  const percent = (used / limit) * 100;
  if (percent < 80) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, quota_warning_80_sent_at, quota_warning_100_sent_at")
    .eq("id", userId)
    .single();

  if (!profile?.email) return;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  if (percent >= 100 && !profile.quota_warning_100_sent_at) {
    await sendQuotaEmail(
      profile.email,
      "Relay notification limit reached",
      "Notification limit reached",
      `You've reached your ${limit} notifications/month limit. New notifications are paused until next month or until you upgrade.`,
    );
    await supabase
      .from("profiles")
      .update({ quota_warning_100_sent_at: new Date().toISOString() })
      .eq("id", userId);
  } else if (
    percent >= 80 &&
    percent < 100 &&
    (!profile.quota_warning_80_sent_at || profile.quota_warning_80_sent_at < thirtyDaysAgo)
  ) {
    await sendQuotaEmail(
      profile.email,
      "You've used 80% of your Relay notifications",
      "You're approaching your limit",
      `You've sent ${used} of ${limit} notifications this month. Upgrade to Pro for unlimited notifications.`,
    );
    await supabase
      .from("profiles")
      .update({ quota_warning_80_sent_at: new Date().toISOString() })
      .eq("id", userId);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
      return jsonResponse(
        { error: "Rate limit exceeded" },
        429,
        { "Retry-After": "60" }
      );
    }

    const contentLength = req.headers.get("content-length");
    if (contentLength && Number.parseInt(contentLength, 10) > MAX_REQUEST_BYTES) {
      return jsonResponse({ error: "Payload too large" }, 413);
    }

    const rawBody = await req.text();
    const requestSize = new TextEncoder().encode(rawBody).length;

    if (requestSize > MAX_REQUEST_BYTES) {
      return jsonResponse({ error: "Payload too large" }, 413);
    }

    let body: NotifyRequest;
    try {
      body = JSON.parse(rawBody) as NotifyRequest;
    } catch {
      return jsonResponse({ error: "Invalid JSON payload" }, 400);
    }

    // Get webhook token from body or URL path
    let webhookToken = typeof body.token === "string" ? body.token.trim() : "";
    if (!webhookToken) {
      const url = new URL(req.url);
      const pathParts = url.pathname.split("/");
      webhookToken = pathParts[pathParts.length - 1];
    }

    if (!webhookToken || webhookToken === "notify" || webhookToken.length < 32) {
      return jsonResponse({ error: "Missing 'token' field (webhook token)" }, 401);
    }

    if (typeof body.title !== "string") {
      return jsonResponse({ error: "title is required" }, 400);
    }

    if (body.body !== undefined && body.body !== null && typeof body.body !== "string") {
      return jsonResponse({ error: "body must be a string" }, 400);
    }

    const sanitizedTitle = sanitizeText(body.title, MAX_TITLE_LENGTH);
    const sanitizedBody =
      typeof body.body === "string"
        ? sanitizeText(body.body, MAX_BODY_LENGTH) || null
        : null;

    if (!sanitizedTitle) {
      return jsonResponse({ error: "title is required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up app
    const { data: app, error: appError } = await supabase
      .from("apps")
      .select("id, user_id, name, notifications_enabled")
      .eq("webhook_token", webhookToken)
      .single();

    if (appError || !app) {
      return jsonResponse({ error: "Invalid webhook token" }, 401);
    }

    if (!app.notifications_enabled) {
      return jsonResponse({ error: "Notifications disabled for this app" }, 403);
    }

    const monthStart = new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)
    ).toISOString();

    const [profileResult, appCountResult, notificationCountResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("plan")
        .eq("id", app.user_id)
        .single(),
      supabase
        .from("apps")
        .select("id", { count: "exact", head: true })
        .eq("user_id", app.user_id),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", app.user_id)
        .gte("created_at", monthStart),
    ]);

    if (profileResult.error || !profileResult.data) {
      console.error("Profile lookup error:", profileResult.error);
      return jsonResponse({ error: "Failed to verify account plan" }, 500);
    }

    if (appCountResult.error) {
      console.error("App quota lookup error:", appCountResult.error);
      return jsonResponse({ error: "Failed to verify app quota" }, 500);
    }

    if (notificationCountResult.error) {
      console.error("Notification quota lookup error:", notificationCountResult.error);
      return jsonResponse({ error: "Failed to verify notification quota" }, 500);
    }

    const plan = profileResult.data.plan === "pro" ? "pro" : "free";
    const appCount = appCountResult.count || 0;
    const monthlyNotificationCount = notificationCountResult.count || 0;

    if (plan === "free" && appCount > FREE_LIMITS.dashboards) {
      return jsonResponse(
        {
          error: "Free plan app limit exceeded",
          limit: FREE_LIMITS.dashboards,
        },
        429
      );
    }

    const monthlyLimit =
      plan === "pro"
        ? PRO_LIMITS.notificationsPerMonth
        : FREE_LIMITS.notificationsPerMonth;

    if (monthlyNotificationCount >= monthlyLimit) {
      return jsonResponse(
        {
          error: "Monthly notification limit exceeded",
          limit: monthlyLimit,
          plan,
        },
        429
      );
    }

    // Validate metadata
    let metadataJson: Record<string, unknown> | null = null;
    if (body.metadata !== undefined && body.metadata !== null) {
      if (typeof body.metadata !== "object" || Array.isArray(body.metadata)) {
        return jsonResponse({ error: "metadata must be a JSON object" }, 400);
      }
      const metadataStr = JSON.stringify(body.metadata);
      if (new TextEncoder().encode(metadataStr).length > MAX_METADATA_BYTES) {
        return jsonResponse({ error: "metadata exceeds 4KB size limit" }, 400);
      }
      if (getJsonDepth(body.metadata) > MAX_METADATA_DEPTH) {
        return jsonResponse({ error: "metadata exceeds maximum nesting depth of 5" }, 400);
      }
      metadataJson = body.metadata;
    }

    let severity: RelaySeverity;
    let channelValue: string | null = null;
    let actions: RelayAction[] | null = null;
    let deepLinkUrl: string | null = null;
    try {
      severity = normalizeSeverity(body.severity);
      channelValue = sanitizeChannel(body.channel);
      actions = validateActions(body.actions);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid notification options";
      return jsonResponse({ error: message }, 400);
    }

    if (body.url !== undefined && body.url !== null) {
      if (typeof body.url !== "string") {
        return jsonResponse({ error: "url must be a string" }, 400);
      }
      const trimmed = body.url.trim();
      if (trimmed.length > 2048) {
        return jsonResponse({ error: "url exceeds 2048 characters" }, 400);
      }
      deepLinkUrl = trimmed;
    }

    const signature = await generateSignature(webhookToken, rawBody);

    // Fetch devices with quiet hours, and channel preferences in parallel
    const [devicesResult, channelPrefResult] = await Promise.all([
      supabase
        .from("devices")
        .select("expo_push_token, quiet_start, quiet_end, utc_offset_minutes")
        .eq("user_id", app.user_id),
      channelValue
        ? supabase
            .from("channel_preferences")
            .select("muted")
            .eq("user_id", app.user_id)
            .eq("channel", channelValue)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const devices = devicesResult.data;

    // If the user has muted this channel, still store the notification but skip push
    const isChannelMuted = channelPrefResult.data?.muted === true;

    // Filter devices by quiet hours (critical bypasses quiet hours)
    const now = new Date();
    type DeviceRow = { expo_push_token: string; quiet_start: string | null; quiet_end: string | null; utc_offset_minutes: number };
    const eligibleDevices: DeviceRow[] = [];
    if (devices && !isChannelMuted) {
      for (const d of devices as DeviceRow[]) {
        if (severity === "critical" || !isInQuietHours(d.quiet_start, d.quiet_end, d.utc_offset_minutes ?? 0, now)) {
          eligibleDevices.push(d);
        }
      }
    }

    // Store notification (always, even if no devices will receive push)
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: app.user_id,
        app_id: app.id,
        title: sanitizedTitle,
        body: sanitizedBody,
        event_type: body.eventType || null,
        metadata_json: metadataJson,
        severity,
        channel: channelValue,
        actions_json: actions,
        deep_link_url: deepLinkUrl,
        request_signature: signature,
        pushed_count: eligibleDevices.length,
      })
      .select("id")
      .single();

    if (notifError) {
      console.error("Insert error:", notifError);
      return jsonResponse(
        { error: "Failed to store notification" },
        500
      );
    }

    // Fire-and-forget quota warning check
    checkQuotaWarning(
      supabase,
      app.user_id,
      monthlyNotificationCount + 1,
      monthlyLimit,
      plan,
    ).catch(() => {});

    if (eligibleDevices.length === 0) {
      const reason = isChannelMuted
        ? "Channel muted by user"
        : !devices || devices.length === 0
          ? "No devices registered"
          : "All devices in quiet hours";
      return jsonResponse(
        {
          success: true,
          notificationId: notification.id,
          pushed: 0,
          signature,
          message: `Stored but not pushed: ${reason}`,
        },
        200
      );
    }

    // Generate callback token for HMAC-signed action callbacks
    const callbackTokenBytes = await crypto.subtle.sign(
      "HMAC",
      await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(webhookToken),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      ),
      new TextEncoder().encode(notification.id)
    );
    const callbackToken = Array.from(new Uint8Array(callbackTokenBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Send push notifications via Expo
    const messages = eligibleDevices.map((d) => ({
      to: d.expo_push_token,
      title: sanitizedTitle,
      body: sanitizedBody || undefined,
      sound: severity === "critical" ? "critical" : "default",
      priority: severity === "critical" ? "max" : "high",
      data: {
        appId: app.id,
        notificationId: notification.id,
        eventType: body.eventType || null,
        severity,
        channel: channelValue,
        actions: actions,
        deepLinkUrl,
        callbackToken,
      },
    }));

    const pushRes = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    const pushResult = await pushRes.json();

    // Store push tickets for receipt processing
    const ticketRows: {
      notification_id: string;
      expo_push_token: string;
      ticket_id: string;
    }[] = [];

    if (pushResult?.data && Array.isArray(pushResult.data)) {
      for (let i = 0; i < pushResult.data.length; i++) {
        const ticket = pushResult.data[i];
        if (ticket?.status === "ok" && ticket.id) {
          ticketRows.push({
            notification_id: notification.id,
            expo_push_token: eligibleDevices[i].expo_push_token,
            ticket_id: ticket.id,
          });
        }
      }
    }

    if (ticketRows.length > 0) {
      const { error: ticketError } = await supabase
        .from("push_tickets")
        .insert(ticketRows);

      if (ticketError) {
        // Non-fatal: notification was already stored and push was sent
        console.error("Failed to store push tickets:", ticketError);
      }
    }

    return jsonResponse(
      {
        success: true,
        notificationId: notification.id,
        pushed: eligibleDevices.length,
        signature,
      },
      200
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
