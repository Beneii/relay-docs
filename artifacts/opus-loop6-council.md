# Loop 6 Council Vote — opus

Focus: things that move money or retain users.

## Top 3

### 1. Push notification compose/preview from dashboard

**Why (retention):** Users currently can't send a test notification from the web UI without writing code or curling a webhook. This is the #1 thing a new user wants to do after signing up — verify the system works end-to-end. The onboarding banner has a "Test" button that hits the webhook, but there's no way to compose a custom message (title, body, severity, channel) and preview it before sending. Adding this turns the dashboard from a read-only monitor into an interactive control panel, which keeps users coming back.

**Scope:**
- "Compose" button in dashboard header or per-app
- Modal with title, body, severity dropdown, channel input, optional URL
- Preview card showing how it will appear on device
- Sends via existing notify endpoint with the dashboard's webhook token
- Free users: counts against notification quota (no special treatment)

**Effort:** Medium — frontend modal + preview component, reuses existing notify backend.

### 2. Quota warning emails (approaching limit)

**Why (money):** When a free user hits their 500-notification limit, they just stop getting notifications silently. That's the worst possible outcome — they churn thinking Relay is broken. Instead, send an email at 80% and 100% usage with a clear upgrade CTA. This is the highest-leverage monetization feature: it catches users at the exact moment they've proven they need Relay and converts them to Pro.

**Scope:**
- After each notification insert, check `notifications_used` against limit
- At 80%: send "You've used 400 of 500 notifications this month" email with upgrade link
- At 100%: send "Limit reached — notifications paused until next month or upgrade" email
- Deduplicate: store `last_quota_warning_sent` on profile to avoid spam
- Use existing Resend email infrastructure and template system

**Effort:** Small-medium — a check in the notify function + two email templates + one column on profiles.

### 3. Team/dashboard sharing (Pro feature)

**Why (money):** This is the only feature on the backlog that directly justifies the Pro price for teams. A solo developer might not upgrade, but a team that shares dashboards across 3-5 people will. Sharing turns Relay from a personal tool into team infrastructure, which is stickier and worth more. It's also the most natural "invite your coworkers" viral loop.

**Scope:**
- `dashboard_members` table: `dashboard_id`, `user_id`, `role` (owner/viewer)
- Invite by email — creates pending invite, sends email via Resend
- Shared dashboards appear in the invitee's dashboard list with a "shared" badge
- Viewers can see notifications but not delete the dashboard or manage tokens
- Pro-only: free users see "Upgrade to share" prompt
- RLS: members can read dashboards/notifications they're invited to

**Effort:** Large — new table, RLS policies, invite flow, email, dashboard UI changes. But it's the Pro-tier killer feature.

## Why this order

1. **Compose/preview** is small effort, huge retention impact — it's the missing "aha moment" for new users
2. **Quota warnings** directly convert free→Pro at the moment of highest intent — pure revenue
3. **Team sharing** is the biggest effort but the biggest long-term revenue driver — it makes Pro worth paying for

## Deprioritized

- **Named API keys** — power-user feature, not blocking anyone yet
- **Email digest** — nice but doesn't move money (users who want digests are already retained)
- **Pricing page hardcoding** — technical debt, no user impact
- **Notification grouping** — mobile polish, not retention-critical
- **relay.json validation** — developer ergonomics, not urgent
- **App store optimization** — premature until core product is sticky
