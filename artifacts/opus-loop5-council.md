# Loop 5 Council Vote — opus

## Top 3 highest-impact items to build next

### 1. Show full webhook URL + quick-start snippet on dashboard

**Why:** Right now the dashboard only shows a truncated opaque token. Non-SDK users (the majority at this stage) have no idea what to do with it. They need the full URL (`https://relayapp.dev/api/notify`) and a copy-pasteable curl example. This is the single biggest friction point between signup and first notification — the thing that determines whether a new user converts or bounces.

**Scope:**
- In `DashboardListSection.tsx`, below each token display, render the full webhook URL and a one-click copy button
- Add a collapsible "Quick Start" panel showing a curl snippet pre-filled with the user's token
- Include SDK install + 3-line code example as an alternative tab

**Effort:** Small — purely frontend, no backend changes.

### 2. Notification search/filter in dashboard

**Why:** The recent notifications panel is currently a flat, unfiltered, unpaginated list. As soon as a user has more than a handful of notifications, it becomes useless for debugging ("did my alert fire?", "what happened at 3am?"). Search and filter is table-stakes for any notification dashboard and directly affects whether users trust Relay enough to rely on it.

**Scope:**
- Add a search input (filters by title/body text)
- Add severity and channel dropdown filters
- Add date range filter (last hour / 24h / 7d / 30d)
- Paginate results (cursor-based, 25 per page)
- Backend: add a new query endpoint or parameterize the existing notification fetch

**Effort:** Medium — needs both frontend filter UI and a backend query endpoint with proper indexing.

### 3. Publish SDK to npm

**Why:** The SDK is built and ready (`@relayapp/sdk` v0.1.0, dist/ exists) but not published. Every piece of documentation and onboarding copy references `npm install @relayapp/sdk`, but running that command fails. This is a credibility gap — it signals "not real yet" to any developer who tries. Publishing is the difference between "cool demo" and "usable product."

**Scope:**
- Add `"repository"` and `"publishConfig"` fields to `packages/sdk/package.json`
- Set `"access": "public"` for scoped package
- Publish with `npm publish --access public`
- Verify install works: `npx @relayapp/sdk` or `npm info @relayapp/sdk`

**Effort:** Tiny — 15-minute task, massive credibility payoff.

## Rationale for ordering

All three address the same meta-problem: **a new user signs up but can't actually use Relay.** The webhook URL display (#1) fixes the immediate "what do I do now?" moment. Notification search (#2) fixes the "is this thing working?" trust gap. SDK publish (#3) fixes the "this isn't a real product" perception. Together they complete the critical path from signup to retained user.

Items I deprioritized:
- **Team sharing** — important for expansion but irrelevant if single users can't onboard
- **Email digest** — nice-to-have, not blocking adoption
- **Pricing page hardcoding** — cosmetic debt, not user-facing friction
- **Named API keys** — power-user feature, premature now
- **Mobile notification grouping** — polish, not core flow
