import { createClient } from "jsr:@supabase/supabase-js@2";

interface NotifyRequest {
  token: string;
  title: string;
  body?: string;
  eventType?: string;
  metadata?: Record<string, unknown>;
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const FREE_APP_LIMIT = 3;
const FREE_MONTHLY_NOTIFICATION_LIMIT = 100;
const PRO_MONTHLY_NOTIFICATION_LIMIT = 10000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const MAX_REQUEST_BYTES = 10 * 1024;
const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 2000;
const MAX_METADATA_BYTES = 4 * 1024;
const MAX_METADATA_DEPTH = 5;

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

    if (plan === "free" && appCount > FREE_APP_LIMIT) {
      return jsonResponse(
        {
          error: "Free plan app limit exceeded",
          limit: FREE_APP_LIMIT,
        },
        429
      );
    }

    const monthlyLimit =
      plan === "pro" ? PRO_MONTHLY_NOTIFICATION_LIMIT : FREE_MONTHLY_NOTIFICATION_LIMIT;

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

    // Store notification
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: app.user_id,
        app_id: app.id,
        title: sanitizedTitle,
        body: sanitizedBody,
        event_type: body.eventType || null,
        metadata_json: metadataJson,
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

    // Fetch device tokens
    const { data: devices } = await supabase
      .from("devices")
      .select("expo_push_token")
      .eq("user_id", app.user_id);

    if (!devices || devices.length === 0) {
      return jsonResponse(
        {
          success: true,
          notificationId: notification.id,
          pushed: 0,
          message: "Stored but no devices registered",
        },
        200
      );
    }

    // Send push notifications via Expo
    const messages = devices.map((d: { expo_push_token: string }) => ({
      to: d.expo_push_token,
      title: sanitizedTitle,
      body: sanitizedBody || undefined,
      sound: "default",
      priority: "high",
      data: {
        appId: app.id,
        notificationId: notification.id,
        eventType: body.eventType || null,
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
            expo_push_token: devices[i].expo_push_token,
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
        pushed: devices.length,
      },
      200
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
