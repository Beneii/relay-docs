RESULT: Designed interactive notification fields/validation across API, DB, edge function, and mobile surfaces plus a relay.json manifest pipeline and SDK helper so custom dashboards self-describe.

INTERACTIVE_NOTIFICATIONS_API:
```ts
export type RelaySeverity = 'info' | 'warning' | 'critical';
export type RelayActionStyle = 'default' | 'destructive';

export interface RelayAction {
  label: string;          // 1-50 visible chars
  url: string;            // HTTPS endpoint Relay POSTs to when action tapped
  style?: RelayActionStyle;
}

export interface NotifyRequest {
  token: string;
  title: string;
  body?: string;
  eventType?: string;
  metadata?: Record<string, unknown>;
  actions?: RelayAction[]; // max 5 entries, optional
  severity?: RelaySeverity; // default 'info'
  channel?: string;         // optional, <= 32 chars, lowercase slug
}
```

INTERACTIVE_NOTIFICATIONS_SQL:
```sql
ALTER TABLE public.notifications
  ADD COLUMN severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  ADD COLUMN channel text,
  ADD COLUMN actions_json jsonb;

CREATE INDEX IF NOT EXISTS notifications_channel_idx ON public.notifications (channel);
CREATE INDEX IF NOT EXISTS notifications_severity_idx ON public.notifications (severity);
```

INTERACTIVE_NOTIFICATIONS_EDGE_FUNCTION:
- Constants: `const MAX_ACTIONS = 5;`, `const MAX_ACTION_LABEL_LENGTH = 50;`, `const MAX_CHANNEL_LENGTH = 32;`. Add helper `isHttpsUrl(value: string)`.
- Parse `body.actions`, `body.severity`, `body.channel` after existing metadata block.
- Validation:
  - `severity` defaults to `'info'`; ensure value in enum.
  - `channel` optional; ensure string, trim, slugify (lowercase letters, numbers, dashes), length <= 32.
  - `actions` optional; must be array length 1..5; each action object requires `label` (string length 1..50) and `url` passing `isHttpsUrl`; `style` optional but if present ensure `'default' | 'destructive'`.
- Store fields when inserting notification:
```ts
const sanitizedChannel = channel ? channel.toLowerCase() : null;
const sanitizedActions = actions?.length ? actions : null;

await supabase
  .from('notifications')
  .insert({
    user_id: app.user_id,
    app_id: app.id,
    title: sanitizedTitle,
    body: sanitizedBody,
    event_type: body.eventType || null,
    metadata_json: metadataJson,
    severity,
    channel: sanitizedChannel,
    actions_json: sanitizedActions,
  })
```
- Include actions/severity/channel when sending Expo payload:
```ts
const pushPayload = {
  to: d.expo_push_token,
  title: sanitizedTitle,
  body: sanitizedBody || undefined,
  sound: severity === 'critical' ? 'critical' : 'default',
  priority: severity === 'critical' ? 'max' : 'high',
  data: {
    appId: app.id,
    notificationId: notification.id,
    eventType: body.eventType || null,
    severity,
    channel: sanitizedChannel,
    actions: sanitizedActions,
  },
};
```
- Limit retries: unchanged. On validation failure return HTTP 400 with descriptive message (`actions must be []`, `action url must be https`).
- Add `validateActions(actions)` helper ensuring arrays of plain objects, no duplicates labels.

INTERACTIVE_NOTIFICATIONS_MOBILE:
- Use `expo-notifications` categories: define per-severity categories (`relay-info`, `relay-warning`, `relay-critical`), each with dynamic actions matching payload (`Notifications.setNotificationCategoryAsync`). For Android use `pressAction` metadata; for iOS include `options: { opensAppToForeground: false }` for quick responses.
- When push received, parse `notification.request.content.data.actions`. Render action buttons using Expo Notification categories (foreground) and in-app UI (NotificationCenter/Recent list) by showing `RelayActionButton` components tied to payload.
- Register `Notifications.addNotificationResponseReceivedListener` to capture taps. Handler reads `response.actionIdentifier`, maps to action index in payload, then spawns background `fetch(action.url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ notificationId, actionId, metadata }) })`.
- Configure `Notifications.setNotificationHandler` to allow background handling. On Android, enable `NotificationChannel` importance mapping severity to `IMPORTANCE_HIGH/URGENT`.
- Guard background fetch by using `TaskManager.defineTask('relay-action-post', ...)` if we need to ensure completion after app termination; otherwise rely on Expo's built-in background service triggered by action buttons.
- Provide UI states (success/failure toast) when app returns to foreground; log analytics with eventType+action pressed.

RELAY_JSON_SCHEMA:
```ts
export interface RelayManifestV1 {
  $schema?: 'https://relayapp.dev/schema/v1';
  schemaVersion: 1;
  name: string;                // display name
  description?: string;
  icon?: string;               // https URL or data URI
  themeColor?: `#${string}`;   // hex
  backgroundColor?: `#${string}`;
  tabs?: Array<{
    id?: string;
    name: string;
    path: string;              // relative path under app base
    icon?: string;
    channel?: string;          // default channel for tab
  }>;
  notifications?: boolean;     // opt into push integration
  defaultChannel?: string;     // slug used unless overridden
  webhookBaseUrl?: string;     // e.g., https://api.example.com/hooks
  metadata?: Record<string, string>;
}
```

RELAY_JSON_MOBILE:
- When user enters dashboard URL, compute manifest URL via `new URL('relay.json', baseUrl).href` (handles trailing slash). Fire `fetch` with AbortController timeout 3000 ms, `cache: 'no-store'`.
- If response status 200 and content-type `application/json`, parse; otherwise treat as missing manifest and keep manual form visible.
- Validation pipeline:
  1. JSON parse inside try/catch; invalid JSON -> log + manual flow.
  2. Run schema validation (zod/yup) enforcing required fields and data types; allow partial manifest: only use fields that validate individually; if `name` missing fallback to existing input.
  3. For optional arrays: filter invalid tab entries (missing name/path) rather than rejecting entire manifest.
- UI auto-population: when manifest valid, pre-fill name/icon/theme/tabs UI and show toast "relay.json detected". Provide toggle to reset if developer wants manual override.
- Cache manifest data per URL in local store for offline use with TTL (e.g., 24h). If fetch fails (network/timeouts), continue manual flow without blocking.

RELAY_JSON_SDK:
- Add `relay.config(manifest: RelayManifestInput): RelayManifestV1` helper exported from SDK:
```ts
import { relayConfig } from '@relayapp/sdk/config';

const manifest = relayConfig({ name: 'Agent Ops', tabs: [{ name: 'Status', path: '/status' }] });
```
- `RelayManifestInput` mirrors schema but makes most fields optional; helper:
  - Fills `schemaVersion: 1` and `$schema` if missing.
  - Validates required `name`, ensures tabs (if provided) contain valid name/path, strips trailing slashes.
  - Validates colors (`/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/`), icons (https/data URI), defaultChannel slug.
  - Throws descriptive errors with path info; optionally returns `[manifest, warnings[]]` for recoverable issues.
- Provide `relay.config` CLI hook (future) but for now it just returns typed manifest developers can `JSON.stringify` into `relay.json` and share same types as SDK `RelayManifestV1`.

RISKS:
- Expo interactive notifications rely on OS support; Android channels + iOS categories require registration before notifications arrive—must sync dynamic actions carefully or fall back to in-app prompts.
- Validating and storing arbitrary action URLs introduces potential SSRF; restricting to https is helpful but we should consider domain allowlists or rate-limits to avoid Relay posting to internal networks.
- relay.json auto-fetch could leak internal dashboard metadata if Relay proxies through public network; need clear UX and CORS-friendly caching plus user consent before auto-loading untrusted manifests.

CONFIDENCE: 0.64
