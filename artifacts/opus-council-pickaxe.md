# Relay Pickaxe Strategy — Architecture & Product Direction

**RESULT:** Relay becomes the mobile runtime for developer-built web tools — the layer that turns any vibe-coded dashboard into a real app on your phone with push notifications, deep linking, and zero deployment friction.

---

## CATEGORY

**"Mobile runtime for web tools"** — or more plainly: **Developer infrastructure for mobile distribution.**

Not a dashboard builder. Not a notification service. Not an app wrapper. Relay is the bridge between "I built a web UI" and "it's a real app on my phone that alerts me." It's the missing last mile for every vibe-coded project.

The closest analogs:
- Vercel is to deployment what Relay is to mobile distribution
- Expo is to React Native what Relay is to any web project
- ntfy does notifications; Relay does notifications + the app they live inside

The category doesn't exist yet. That's the opportunity.

---

## TOP FEATURES

### 1. `@relayapp/sdk` — JavaScript/TypeScript SDK

**What:** An npm package that gives any web project push notifications, app registration, and presence awareness in one import.

```typescript
import { Relay } from '@relayapp/sdk'

const relay = new Relay({ token: 'YOUR_DASHBOARD_TOKEN' })

// Send a push notification
await relay.notify({
  title: 'Build complete',
  body: 'All 47 tests passed',
  url: '/builds/latest'  // deep link path within the dashboard
})

// Check if user is viewing this dashboard on mobile right now
const isLive = await relay.isConnected()
```

**Rationale:** The current API is a raw `curl POST`. An SDK makes Relay feel native to the codebase. Vibe-coders copy-paste npm installs — they don't copy-paste curl commands into their code. The SDK is the distribution mechanism for the product itself.

### 2. `relay.json` — App Manifest

**What:** A static manifest file at the root of any web project that describes it to Relay.

```json
{
  "name": "Trading Bot Dashboard",
  "icon": "/icon.png",
  "theme_color": "#3B82F6",
  "notifications": true,
  "tabs": [
    { "name": "Portfolio", "path": "/" },
    { "name": "Trades", "path": "/trades" },
    { "name": "Settings", "path": "/settings" }
  ]
}
```

**Rationale:** When a user adds a URL to Relay, the mobile app fetches `relay.json` to auto-configure the dashboard — name, icon, theme, navigation tabs. This transforms "paste a URL and get a webview" into "paste a URL and get a native-feeling app." It also creates a standard that AI coding tools can generate automatically.

### 3. Notification Channels & Severity

**What:** Expand notifications beyond simple title/body to support channels, severity levels, actions, and grouping.

```typescript
await relay.notify({
  channel: 'trades',        // user can mute/configure per-channel
  severity: 'critical',     // critical | warning | info
  title: 'Stop loss triggered',
  body: 'BTC position closed at $42,100',
  actions: [
    { label: 'View Trade', url: '/trades/latest' },
    { label: 'Dismiss', dismiss: true }
  ],
  group: 'trading-alerts',  // collapsed on phone when multiple
  silent: false
})
```

**Rationale:** This is where Relay leapfrogs ntfy/Pushover. Those services send flat notifications. Relay sends contextual notifications that deep-link into the specific dashboard with actionable buttons. The notification isn't just an alert — it's a portal back into the tool. Channels also let power users manage notification fatigue across many dashboards.

### 4. One-Line Embed Script (No-SDK Option)

**What:** A `<script>` tag that any HTML page can include to get Relay features without npm.

```html
<script src="https://cdn.relayapp.dev/embed.js" data-token="YOUR_TOKEN"></script>
<script>
  Relay.notify({ title: 'Job done', body: 'Check results' })
</script>
```

**Rationale:** Not every vibe-coded project uses npm. Many are single HTML files, Python Flask apps with templates, or static sites. The embed script captures the long tail of "just paste this one line" developers. It also works in AI-generated code — an LLM can add one `<script>` tag and the project has push notifications.

### 5. CLI Tool for Non-Web Use Cases

**What:** A tiny CLI for sending notifications from shell scripts, cron jobs, CI/CD.

```bash
npx @relayapp/cli notify "Deploy complete" --body "v2.1.0 is live" --channel deploys
# or installed globally
relay notify "Backup finished" --severity info
```

**Rationale:** Replaces the raw curl command with something memorable and ergonomic. Also enables: `relay init` to create a `relay.json`, `relay test` to send a test notification, `relay status` to check connection. The CLI becomes the onboarding tool.

---

## DX — Developer Experience

### The 60-Second Pitch

A vibe-coder just built a dashboard with Cursor/Claude. They want it on their phone with notifications. Here's what they do:

1. `npm install @relayapp/sdk` (or paste the embed script)
2. Add `relay.notify()` calls where they want alerts
3. Open Relay on their phone, paste the dashboard URL
4. Done — it's an app on their phone that sends them notifications

No server to deploy. No Firebase to configure. No APNs certificates. No Play Store listing. One SDK, one URL, one phone.

### Integration Guides (AI-Optimized)

Every guide should be copy-pasteable by an LLM. The documentation should include:

- "Add this to your Cursor rules" snippets
- "Tell Claude to add Relay notifications to this project" prompts
- Framework-specific guides: Next.js, Vite, Flask, FastAPI, Express, plain HTML
- AI agent framework guides: LangChain, CrewAI, AutoGPT, Obelisk

### Error Messages That Teach

```
RelayError: Token not found.
  → Create a dashboard at relayapp.dev/dashboard to get your token.
  → Docs: relayapp.dev/docs/quickstart
```

Every error should tell the developer exactly what to do next.

---

## PRICING

Dev tools need generous free tiers and usage-based scaling. Feature-gating kills adoption.

### Free (Hobby)
- 3 dashboards
- 500 notifications/month (up from 100 — the current 100 is too restrictive to demonstrate value)
- 1 device
- All notification features (channels, severity, actions)
- SDK + embed + CLI access
- Community support

### Pro ($5/month or $48/year)
- Unlimited dashboards
- 10,000 notifications/month
- 5 devices
- Priority notification delivery
- Custom app icons via relay.json
- Email support

### Team ($12/month per seat, or $120/year)
- Everything in Pro
- Shared dashboards across team members
- 50,000 notifications/month per seat
- Team notification channels
- Webhook logs + delivery analytics
- Slack/Discord integration

**Key pricing changes from current:**
1. **Price drop from $7.99 to $5** — dev tools need to feel cheap. $5/month is impulse-buy territory. $8 triggers cost-benefit analysis.
2. **Free tier bumped to 500 notifications** — enough to actually use the product daily for a month. The upgrade trigger should be "I love this and want more," not "I hit the wall before I understood the product."
3. **Team tier added** — this is where the real revenue is. One developer adopts Relay for a side project, then brings it to their team's internal tools.

---

## LANDING PAGE

### New Headline
**"Your dashboards, on your phone. With push notifications."**

### New Subhead
"Relay turns any web dashboard into a native mobile app. Add push notifications with one line of code. Built for the tools you build."

### Three Value Props

1. **One SDK, instant notifications.**
   `npm install @relayapp/sdk` — then `relay.notify()` anywhere in your code. No Firebase. No APNs. No server. Push notifications for any web project in 60 seconds.

2. **Any URL becomes a native app.**
   Paste your dashboard URL into Relay. It loads in a native mobile wrapper with deep linking, tabs, and offline awareness. Your Grafana, your trading bot, your AI agent panel — all in one app on your phone.

3. **Built for what you build.**
   Relay is designed for developer-built tools: AI agent dashboards, self-hosted monitoring, internal apps, automation UIs. Not another SaaS dashboard — the infrastructure your dashboards plug into.

### Positioning Shift

Old: "Push notifications for your dashboards and scripts"
New: "The mobile runtime for developer-built web tools"

The old positioning described a feature. The new positioning describes a category. Features compete on specs. Categories compete on identity.

---

## ARCHITECTURE CHANGES

### What Stays the Same
- Supabase for auth, database, RLS, edge functions — all still appropriate
- Vercel for web hosting and serverless API routes — no change needed
- Stripe billing — just update price points and add team tier
- React + Vite + Tailwind frontend — the marketing site and dashboard work fine
- Expo mobile app — still the right choice for the native wrapper

### What Changes

#### 1. SDK Package (`@relayapp/sdk`)
**New repo or monorepo package.** Lightweight TypeScript library published to npm.

```
packages/
  sdk/           # @relayapp/sdk — browser + Node.js
  cli/           # @relayapp/cli — CLI tool
  embed/         # CDN embed script (bundled from sdk)
```

The SDK wraps the existing webhook API. Internally it's just HTTP POSTs, but it adds:
- TypeScript types for all notification options
- Automatic retry with exponential backoff
- Token validation before sending
- Helpful error messages
- Optional batching for high-frequency senders

**Architecture impact:** Minimal. The SDK is a client library over the existing API. No backend changes needed for v1.

#### 2. Notification Channels & Severity
**Database changes:**
```sql
ALTER TABLE notifications ADD COLUMN channel TEXT;
ALTER TABLE notifications ADD COLUMN severity TEXT DEFAULT 'info';
ALTER TABLE notifications ADD COLUMN actions JSONB;
ALTER TABLE notifications ADD COLUMN group_key TEXT;
```

**Edge function changes:** The `notify` edge function needs to accept and store these new fields, and pass them through to Expo push (using `data` field for deep link actions).

**Mobile app changes:** Render channel badges, severity-colored notifications, action buttons.

#### 3. `relay.json` Manifest Support
**Mobile app change only.** When a user adds a URL, the app fetches `{url}/relay.json`. If found, auto-populate name, icon, theme, tabs. If not found, fall back to current manual entry.

**No backend changes.** The manifest is fetched client-side by the mobile app.

#### 4. Team Support (Later Phase)
**Database changes:**
```sql
CREATE TABLE teams (id UUID PRIMARY KEY, name TEXT, created_at TIMESTAMPTZ);
CREATE TABLE team_members (team_id UUID REFERENCES teams, user_id UUID REFERENCES profiles, role TEXT);
ALTER TABLE apps ADD COLUMN team_id UUID REFERENCES teams;  -- nullable, for shared dashboards
```

**API changes:** New endpoints for team management, invitation flow, shared dashboard access.

**This is Phase 2.** Don't build this until individual adoption is proven.

#### 5. CDN for Embed Script
Host the embed script on a CDN (Vercel Edge or CloudFlare). Small — probably under 5KB gzipped. Versioned (`/v1/embed.js`).

### Migration Path
All changes are additive. Nothing breaks the existing API. Current users' `curl POST` commands keep working. The SDK is a layer on top, not a replacement.

---

## RISKS

### 1. SDK Adoption Is Slow — The "chicken and egg" Problem
The SDK's value depends on the mobile app being installed. The mobile app's value depends on dashboards using the SDK. If neither side reaches critical mass, both stall.

**Mitigation:** The SDK must work standalone as a notification API even without the mobile app (send to email/browser fallback?). And the mobile app must be useful even without SDK-enhanced dashboards (it already wraps any URL). The two sides should be independently valuable, not co-dependent.

### 2. Scope Creep Into Platform Territory
Adding SDK, CLI, embed script, manifest format, channels, teams — this is 6 months of work for a solo developer. The risk is building too much infrastructure before validating that any of it matters.

**Mitigation:** Ship in this order: (1) SDK with just `notify()`, (2) relay.json manifest, (3) channels/severity, (4) CLI, (5) embed script, (6) teams. Each step should be validated before starting the next. The SDK is the only thing that matters in month one.

### 3. The "Pickaxe" Market Might Be Smaller Than It Looks
Vibe-coding is a trend. Trends have half-lives. Many vibe-coded projects are abandoned within a week. The addressable market of "developers who build web dashboards, maintain them, and want mobile access" may be smaller and less monetizable than the current hype suggests.

**Mitigation:** The product should work for both vibe-coders and traditional developers. The positioning can ride the wave without depending on it. Self-hosted tool users (Grafana, Home Assistant) are a stable, proven market that isn't going away.

---

## BUILD FIRST

**Ship `@relayapp/sdk` v0.1.0 with just `relay.notify()` and get it on npm.**

This is the single highest-leverage action because:

1. **It changes the distribution model.** Right now, Relay is discovered via the app store or the landing page. An npm package is discovered via `npm search`, AI coding assistants, and developer word-of-mouth. Every project that installs the SDK is a distribution channel.

2. **It's small.** The v0.1.0 SDK is maybe 200 lines of TypeScript. It wraps the existing webhook API. No backend changes. Ship it in a weekend.

3. **It validates the pivot.** If developers install the SDK and use it, the pickaxe thesis is correct. If they don't, you've lost a weekend, not a quarter.

4. **AI assistants will recommend it.** When a developer asks Claude or Cursor "how do I add push notifications to my web app," the answer should be `npm install @relayapp/sdk`. That's the growth loop.

The SDK should be published, a 2-minute quickstart guide should be on the site, and the landing page should show `npm install @relayapp/sdk` above the fold. Everything else — manifest, channels, CLI, teams — comes after the SDK exists and is being used.

---

**CONFIDENCE: 0.76**

The pickaxe thesis is directionally correct — infrastructure for builders is a better business than being one more builder's tool. But the execution risk is real: SDK adoption is hard, the market size is uncertain, and a solo developer building an SDK + mobile app + web platform + billing is a lot of surface area. The confidence is moderate because the strategy is sound but the path to traction has several points where it could stall.
