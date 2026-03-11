# Post-Sprint Council: What to Build Next — opus

## Where Relay stands after 10 loops

The product is functionally complete for a v1. A developer can sign up, add a dashboard, receive push notifications, manage devices, set quiet hours, mute channels, compose test notifications, search/filter history, share dashboards with teammates, and upgrade to Pro. The SDK exists, docs exist, emails work, billing works.

What's missing isn't features — it's distribution, stickiness, and monetization depth.

## Top 3 priorities

### 1. Publish SDK to npm + build integrations for popular tools

**What:** Publish `@relayapp/sdk` to npm (it's built, just not published). Then build 3-5 pre-built integrations: GitHub Actions, Vercel deploy hooks, Supabase edge function helper, Stripe webhook forwarder, and a generic Zapier/n8n webhook relay.

**Why (distribution):** Right now, adopting Relay requires reading docs and writing code. Every integration you ship is a zero-friction onboarding path. "Add Relay to your GitHub Actions in 2 lines" is a blog post, a tweet, a Show HN post. The SDK on npm is table stakes — it's the difference between "interesting demo" and "real tool I can depend on." Integrations are the growth hack: each one taps into an existing community of developers who already have the problem Relay solves.

**Revenue impact:** Integrations drive top-of-funnel. Every new user who hits the 500 notification limit on their CI pipeline is a Pro conversion. CI/deploy notifications are high-volume by nature — they hit the free limit fast.

**Defensibility:** Network effects are weak for notification tools, but integration breadth is a moat. Once someone has Relay wired into GitHub + Vercel + Stripe, switching costs are real.

### 2. Scheduled digest emails (daily/weekly summary)

**What:** Let users opt into a daily or weekly email digest summarizing their notifications. Per-dashboard or global. Include: notification count by severity, top channels, any critical alerts, link to full history.

**Why (retention):** Push notifications are ephemeral — users swipe and forget. A digest email is a weekly touchpoint that reminds users Relay exists, shows value even when they're not actively checking, and brings them back to the dashboard. It's the difference between "tool I set up once" and "tool that's part of my workflow."

For teams especially, a shared weekly summary email is how Relay becomes a team ritual rather than an individual utility.

**Revenue impact:** Digest emails are the gentlest upsell vehicle. "You received 487 of 500 notifications this month" in a weekly summary is more effective than a one-time quota warning. It creates recurring awareness of usage approaching limits.

**Defensibility:** Digest emails create habit loops. Users who read a weekly Relay summary are 5x less likely to churn than users who only receive push notifications (standard SaaS retention pattern).

### 3. Webhook replay + debugging tools

**What:** Store the last 50 raw webhook payloads per dashboard (request headers, body, response status, latency). Add a "Delivery Log" view in the dashboard showing each incoming webhook with success/failure status. Add a "Replay" button that re-sends a stored payload through the notify pipeline. Add webhook signature verification status (valid/invalid/missing).

**Why (stickiness):** This is the feature that makes Relay indispensable rather than replaceable. Right now, when a notification doesn't arrive, the user has no way to debug it. Was the webhook never sent? Was it malformed? Did quiet hours block it? A delivery log answers all of these. Replay lets users test without re-triggering the upstream event. This turns Relay from "notification forwarder" into "notification infrastructure" — a much stickier category.

**Revenue impact:** Debugging tools are a natural Pro feature (free: last 10 deliveries, Pro: last 50 + replay). They also reduce churn from frustration — users who can't debug a failed notification blame Relay and leave.

**Defensibility:** Observability tooling is the moat. Competitors can copy "send push notification from webhook" in a weekend. They can't easily replicate a full delivery log with replay, signature verification, quiet hours audit trail, and channel routing visibility. This is what makes Relay a platform rather than a pipe.

## What I'm explicitly NOT recommending

- **More mobile UI polish** (notification grouping, threading) — diminishing returns; the current UI is good enough
- **A/B testing or growth experiments** — premature; optimize for product-market fit signals first
- **App Store optimization** — do this when organic installs plateau, not before
- **Named API keys** — power-user feature with near-zero demand signal
- **Custom branding / white-label** — enterprise feature; premature at current scale
- **Self-hosted option** — fragments the product, kills SaaS revenue

## Sequencing

1. **SDK publish + integrations** (1-2 weeks) — unblocks all distribution
2. **Digest emails** (1 week) — low effort, high retention impact
3. **Webhook replay + debugging** (2-3 weeks) — largest effort, largest defensibility payoff

The order matters: you need users (integrations) before you can retain them (digests) and make them dependent (debugging tools).
