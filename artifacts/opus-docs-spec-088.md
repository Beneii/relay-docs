# Spec: /docs Page (src/pages/Docs.tsx)

## Design Notes

- Uses same `LandingNav` + `LandingFooter` as Pricing page
- Same theme (bg-bg, text-text-main, accent color, dark mode support)
- Single-page layout with sticky sidebar navigation (left) and content (right) on desktop; sidebar collapses to a top dropdown on mobile
- Code blocks use `bg-bg border border-border rounded-xl p-6 font-mono text-sm` (matching the landing page code demo style)
- Tables use `border-collapse` with `border-border` and `bg-surface` header rows
- Section anchors: each h2 gets an `id` for hash navigation (`/docs#quickstart`, `/docs#sdk-reference`, etc.)
- Add route in `main.tsx`: `lazy(() => import('./pages/Docs'))` at path `/docs`

## Sidebar Navigation

```
Quickstart
SDK Reference
  - NotifyOptions
  - RelayAction
  - Severity & Channels
  - NotifyResponse
Interactive Notifications
relay.json Manifest
REST API Reference
Limits & Quotas
Error Codes
```

---

## Section 1: Quickstart

### Heading
**Get started in 60 seconds**

### Content

**Step 1: Install**

```bash
npm install @relayapp/sdk
```

**Step 2: Initialize**

```typescript
import { Relay } from '@relayapp/sdk'

const relay = new Relay({
  token: process.env.RELAY_TOKEN  // 64-char hex token from your dashboard
})
```

**Step 3: Send a notification**

```typescript
await relay.notify({
  title: 'Build complete',
  body: 'All 47 tests passed.',
})
```

Below the code, a callout box:

> Your webhook token is on your [dashboard](/dashboard). Each saved dashboard gets a unique token. The token is a 64-character hex string.

---

## Section 2: SDK Reference

### 2a. RelayConfig

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | `string` | Yes | 64-character hex webhook token from your dashboard. |
| `endpoint` | `string` | No | Override the API endpoint. Defaults to `https://relayapp.dev/webhook`. |

### 2b. NotifyOptions

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `title` | `string` | Yes | Notification title shown on the device. | Max 200 chars. Trimmed. |
| `body` | `string` | No | Notification body text. | Max 2,000 chars. |
| `url` | `string` | No | Deep link path within your dashboard. When the user taps the notification, the webview navigates to this path. | Max 2,048 chars. Relative path (e.g. `"/trades/latest"`). |
| `severity` | `"info" \| "warning" \| "critical"` | No | Notification priority level. Affects sound, vibration, and display on the device. Default: `"info"`. | See [Severity Levels](#severity-levels). |
| `channel` | `string` | No | Logical group for notification management. Users can mute/configure channels. | Max 32 chars. Lowercase alphanumeric + hyphens. Auto-slugified. |
| `actions` | `RelayAction[]` | No | Action buttons shown on the notification. | Max 5 actions. See [RelayAction](#relayaction). |
| `eventType` | `string` | No | Custom event label for filtering and analytics. | Stored as-is. |
| `metadata` | `Record<string, unknown>` | No | Arbitrary JSON metadata attached to the notification. | Max 4 KB. Max nesting depth: 5. |

### 2c. RelayAction

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `label` | `string` | Yes | Button text shown on the notification. | Max 50 chars. Must be unique within the actions array (case-insensitive). |
| `url` | `string` | Yes | HTTPS URL that Relay POSTs to when the user taps this action. | Must be a valid `https://` URL. |
| `style` | `"default" \| "destructive"` | No | Visual hint. `"destructive"` renders the button in red on iOS. Default: `"default"`. | |

**Action callback POST body:**

When a user taps an action button, Relay sends a POST request to the action's `url` with this JSON body:

```json
{
  "notificationId": "uuid-of-the-notification",
  "actionLabel": "Approve",
  "actionIndex": 0
}
```

### 2d. Severity Levels

| Level | Behavior |
|-------|----------|
| `"info"` | Default sound. Standard notification display. |
| `"warning"` | Default sound. High-importance Android channel. iOS time-sensitive delivery. |
| `"critical"` | Alert sound. Maximum priority Android channel. iOS critical alert (if entitlement granted). Bypasses Do Not Disturb where supported. |

**Example:**

```typescript
await relay.notify({
  title: 'Stop loss triggered',
  body: 'BTC position closed at $42,100',
  severity: 'critical',
  channel: 'trading',
})
```

### 2e. NotifyResponse

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Always `true` on 200. |
| `notificationId` | `string` | UUID of the stored notification. |
| `pushed` | `number` | Number of devices the push was sent to. `0` if no devices registered. |

---

## Section 3: Interactive Notifications

### Heading
**Add action buttons to your notifications**

### Content

Action buttons let users respond to notifications without opening the app. When tapped, Relay POSTs to the URL you specify — your backend receives the callback and can take action.

**Example: Agent approval flow**

```typescript
await relay.notify({
  title: 'Agent needs approval',
  body: 'Obelisk wants to deploy v2.1.0 to production.',
  severity: 'warning',
  url: '/deployments/pending',
  actions: [
    {
      label: 'Approve',
      url: 'https://api.yourapp.com/deployments/123/approve',
    },
    {
      label: 'Reject',
      url: 'https://api.yourapp.com/deployments/123/reject',
      style: 'destructive',
    },
  ],
})
```

**Example: Trading alert with deep link**

```typescript
await relay.notify({
  title: 'Trade executed',
  body: 'Bought 0.5 ETH at $3,200',
  channel: 'trades',
  url: '/trades/latest',
  actions: [
    { label: 'View Trade', url: 'https://api.yourbot.com/trades/789/details' },
    { label: 'Cancel All', url: 'https://api.yourbot.com/trades/cancel-all', style: 'destructive' },
  ],
})
```

Callout box:

> Action URLs must use HTTPS. Labels must be unique within a single notification. Maximum 5 actions per notification.

---

## Section 4: relay.json Manifest

### Heading
**Auto-configure your dashboard in Relay**

### Content

Drop a `relay.json` file in your project's public root. When a user adds your dashboard URL to Relay, the mobile app fetches this file and auto-configures the name, icon, theme, and navigation tabs.

**Example relay.json:**

```json
{
  "$schema": "https://relayapp.dev/schema/v1",
  "schema_version": 1,
  "name": "Trading Bot Dashboard",
  "icon": "/icon-192.png",
  "theme_color": "#3B82F6",
  "background_color": "#09090b",
  "notifications": true,
  "default_channel": "alerts",
  "tabs": [
    { "name": "Portfolio", "path": "/" },
    { "name": "Trades", "path": "/trades" },
    { "name": "Settings", "path": "/settings" }
  ]
}
```

### Manifest Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Display name in the Relay app. Max 50 chars. |
| `description` | `string` | No | Short description. |
| `icon` | `string` | No | Relative path (`/icon.png`), HTTPS URL, or data URI. Recommended: 192x192 PNG. |
| `theme_color` | `string` | No | Hex color (`#RRGGBB` or `#RRGGBBAA`). Used for header tint and accent. |
| `background_color` | `string` | No | Hex color. Used for loading/splash screen. |
| `notifications` | `boolean` | No | Whether this app sends push notifications. Default: `true`. |
| `default_channel` | `string` | No | Default notification channel slug. |
| `webhook_base_url` | `string` | No | HTTPS base URL for webhook callbacks. |
| `tabs` | `RelayManifestTab[]` | No | Navigation tabs. Max 5. If omitted, single-page mode. |
| `metadata` | `Record<string, string>` | No | Arbitrary key-value metadata. |

### Tab Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Tab label. Max 20 chars. |
| `path` | `string` | Yes | URL path relative to the dashboard root. Must start with `/`. |
| `icon` | `string` | No | Icon identifier or URL. |
| `channel` | `string` | No | Default notification channel for this tab. |

### SDK Helper

Use `relayConfig()` to validate and normalize a manifest object:

```typescript
import { relayConfig } from '@relayapp/sdk'

const manifest = relayConfig({
  name: 'Agent Dashboard',
  theme_color: '#10B981',
  tabs: [
    { name: 'Status', path: '/status' },
    { name: 'Logs', path: '/logs' },
  ],
})

// Write to relay.json
import { writeFileSync } from 'fs'
writeFileSync('public/relay.json', JSON.stringify(manifest, null, 2))
```

`relayConfig()` fills `$schema` and `schema_version`, validates colors, ensures paths start with `/`, strips trailing slashes, and slugifies channel names. It throws descriptive errors on invalid input.

Callout:

> If relay.json is not found or invalid, Relay falls back to the manual entry flow. Fields are applied individually — a partial manifest (e.g. only `name`) still works.

---

## Section 5: REST API Reference

### Heading
**Use the raw HTTP API from any language**

### Content

If you're not using JavaScript/TypeScript, send a POST request directly.

**Endpoint:**

```
POST https://relayapp.dev/webhook/{YOUR_TOKEN}
Content-Type: application/json
```

Or include the token in the body:

```
POST https://relayapp.dev/webhook
Content-Type: application/json

{
  "token": "YOUR_TOKEN",
  "title": "...",
  ...
}
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | `string` | Yes* | Webhook token. *Not required if token is in the URL path. |
| `title` | `string` | Yes | Notification title. Max 200 chars. |
| `body` | `string` | No | Notification body. Max 2,000 chars. |
| `url` | `string` | No | Deep link path. Max 2,048 chars. |
| `severity` | `string` | No | `"info"`, `"warning"`, or `"critical"`. Default: `"info"`. |
| `channel` | `string` | No | Channel slug. Max 32 chars. |
| `actions` | `array` | No | Action buttons. Max 5. Each: `{ label, url, style? }`. |
| `eventType` | `string` | No | Custom event label. |
| `metadata` | `object` | No | Arbitrary JSON. Max 4 KB, max depth 5. |

### Response (200)

```json
{
  "success": true,
  "notificationId": "a1b2c3d4-...",
  "pushed": 2
}
```

### Examples

**Bash:**

```bash
curl -X POST https://relayapp.dev/webhook/YOUR_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Deploy complete",
    "body": "v2.1.0 is live",
    "severity": "info"
  }'
```

**Python:**

```python
import requests

requests.post(
    "https://relayapp.dev/webhook/YOUR_TOKEN",
    json={
        "title": "Model trained",
        "body": "Accuracy: 98.5%",
        "actions": [
            {"label": "View Results", "url": "https://api.example.com/results/latest"}
        ],
    },
)
```

**GitHub Actions:**

```yaml
- name: Notify via Relay
  run: |
    curl -X POST https://relayapp.dev/webhook/${{ secrets.RELAY_TOKEN }} \
      -H "Content-Type: application/json" \
      -d '{"title": "Workflow ${{ github.workflow }} completed"}'
```

---

## Section 6: Limits & Quotas

### Heading
**Plan limits**

| | Free | Pro ($7.99/mo) |
|---|---|---|
| Dashboards | 3 | Unlimited |
| Devices | 1 | 10 |
| Notifications / month | 500 | 10,000 |
| Notification history | 10 most recent | 50 most recent |
| Actions per notification | 5 | 5 |
| SDK + REST API access | Yes | Yes |
| Interactive actions | Yes | Yes |

### Rate Limits

| Limit | Value |
|-------|-------|
| Requests per IP per minute | 60 |
| Max request payload | 10 KB |
| Max title length | 200 chars |
| Max body length | 2,000 chars |
| Max deep link URL | 2,048 chars |
| Max metadata size | 4 KB |
| Max metadata nesting depth | 5 levels |
| Max actions per notification | 5 |
| Max action label length | 50 chars |
| Max channel name length | 32 chars |

### Token Format

Webhook tokens are 64-character lowercase hexadecimal strings (32 random bytes). Example:

```
a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
```

Each dashboard gets a unique token. Tokens are generated when you add a dashboard and can be copied from your [dashboard](/dashboard).

---

## Section 7: Error Codes

### Heading
**Error responses**

All errors return JSON:

```json
{
  "error": "Human-readable error message"
}
```

| Status | Error | Cause | Fix |
|--------|-------|-------|-----|
| `400` | `"Invalid JSON payload"` | Request body is not valid JSON. | Check your JSON syntax. |
| `400` | `"title is required"` | Missing or empty `title` field. | Include a non-empty `title` string. |
| `400` | `"body must be a string"` | `body` field is not a string. | Pass `body` as a string or omit it. |
| `400` | `"severity must be one of info, warning, or critical"` | Invalid severity value. | Use `"info"`, `"warning"`, or `"critical"`. |
| `400` | `"channel must contain alphanumeric characters"` | Channel is empty after slugification. | Use letters, numbers, and hyphens. |
| `400` | `"actions must include between 1 and 5 entries"` | Actions array is empty or too long. | Provide 1-5 action objects. |
| `400` | `"action url at index N must be a valid https URL"` | Action URL is not HTTPS. | All action URLs must use `https://`. |
| `400` | `"action labels must be unique"` | Duplicate action labels (case-insensitive). | Use distinct labels for each action. |
| `400` | `"metadata exceeds 4KB size limit"` | Metadata JSON is too large. | Reduce metadata payload size. |
| `400` | `"url exceeds 2048 characters"` | Deep link URL is too long. | Shorten the URL path. |
| `401` | `"Missing 'token' field (webhook token)"` | No token in body or URL path, or token is too short. | Include your 64-char hex token. |
| `401` | `"Invalid webhook token"` | Token doesn't match any dashboard. | Check the token on your [dashboard](/dashboard). |
| `403` | `"Notifications disabled for this app"` | Dashboard has notifications turned off. | Enable notifications in dashboard settings. |
| `405` | `"Method not allowed"` | Not a POST request. | Use `POST` method. |
| `413` | `"Payload too large"` | Request body exceeds 10 KB. | Reduce payload size. |
| `429` | `"Rate limit exceeded"` | More than 60 requests/minute from this IP. | Wait 60 seconds and retry. |
| `429` | `"Monthly notification limit exceeded"` | Hit your plan's monthly quota. | Upgrade to Pro or wait for the next billing cycle. |
| `429` | `"Free plan app limit exceeded"` | More dashboards than the free plan allows. | Remove a dashboard or upgrade to Pro. |
| `500` | `"Internal server error"` | Unexpected server failure. | Retry the request. If persistent, contact support. |

---

## Content Edge Cases

1. **Code blocks must be copy-friendly.** Add a "Copy" button to each code block (small clipboard icon, top-right, shows "Copied" for 2s on click).
2. **Anchor links.** Each h2 and h3 should have a clickable anchor icon on hover for direct linking.
3. **Mobile layout.** Sidebar becomes a sticky horizontal nav or dropdown at the top. Code blocks must scroll horizontally, not wrap.
4. **Token placeholder.** All code samples use `YOUR_TOKEN` or `process.env.RELAY_TOKEN` — never a real token.
5. **SDK not yet on npm.** If the SDK isn't published yet, add a temporary note: "The SDK will be available on npm soon. In the meantime, use the REST API directly."
6. **Syntax highlighting.** Use a lightweight approach — Tailwind classes for keyword coloring in `<code>` blocks, or a client-side highlighter like `shiki` (already used by many Vite projects). Don't add a heavy dependency.
7. **Search.** Not needed for v1. The page is short enough to scroll.

---

**CONFIDENCE: 0.88**

The spec covers all requested sections with exact field tables derived from the actual codebase types and edge function validation constants. Code samples are consistent with the SDK's actual API surface (including the newly-added `actions`, `severity`, `channel` fields). Limits match `product.ts` (500 free) and the edge function constants. The main uncertainty is styling details (exact Tailwind classes for the sidebar, code block highlight approach) which should be resolved during implementation.
