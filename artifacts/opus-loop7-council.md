# Loop 7 Council Vote — opus

Focus: 4 loops left. Complete the product, make it defensible.

## Top 3 priorities for loops 7-10

### 1. Team/dashboard sharing (loops 7-8)

**Why:** This is the single feature that makes Relay a business rather than a toy. Solo developers churn — teams don't. Sharing creates lock-in (switching costs multiply with every team member), justifies the Pro price, and is the only organic growth channel (every invite is a new user). Without it, Relay is a personal utility competing on price against free alternatives. With it, Relay is team infrastructure that earns recurring revenue.

**Scope across 2 loops:**
- Loop 7: `dashboard_members` table, invite-by-email flow, Resend invite email, RLS policies for shared access, accept/decline invite endpoint
- Loop 8: Dashboard UI for managing members (invite, remove, role display), shared dashboards appear in invitee's list with "shared" badge, Pro gate (free users see upgrade prompt)

This is the largest remaining feature and needs 2 loops to do right.

### 2. Push notification history in mobile app (loop 9)

**Why:** Right now the mobile app is a dumb launcher — notifications arrive via OS, and once swiped away they're gone. Users need to scroll back through their notification history inside the app. This is what makes users open Relay daily instead of just waiting for pushes. Daily opens = retention = revenue. It also makes the "notification search/filter" we built in loop 5 (web only) available on mobile, which is where users actually are.

**Scope:**
- New tab or section in mobile app showing notification history
- Pull-to-refresh, infinite scroll with cursor pagination
- Severity badges, channel tags, timestamps
- Tap to expand full body + metadata
- Filter by app/dashboard

### 3. Centralize pricing/product config + hardcoded string cleanup (loop 10)

**Why:** This is the "complete the product" item. The pricing page has hardcoded prices and feature strings that drift from `shared/product.ts`. The free plan summary in emails says one thing, the pricing page says another. Before any real marketing push or App Store listing, all user-facing copy about plans, limits, and pricing must come from a single source. This prevents embarrassing inconsistencies and makes future price changes safe (change one file, not six).

**Scope:**
- Move price strings ($7.99, $79, "Save 17%") into `shared/product.ts`
- Pricing page reads all values from shared config
- Email templates reference the same constants
- Landing page feature comparisons reference shared config
- Audit all plan-related strings across codebase

## 4-loop roadmap

| Loop | Focus |
|------|-------|
| 7 | Team sharing: backend (schema, invites, RLS, emails) |
| 8 | Team sharing: frontend (dashboard UI, shared views, Pro gate) |
| 9 | Mobile notification history (in-app history tab, pagination, filters) |
| 10 | Product config centralization + final polish pass |

## What I'm cutting

- **Named API keys** — power-user feature, zero users are asking for it
- **Email digest** — nice but doesn't complete the product or make it defensible
- **Notification grouping/threading** — mobile polish, not critical
- **relay.json validation** — developer ergonomics for a flow that barely exists yet
- **A/B test / waitlist** — premature optimization; ship the feature first
- **App Store optimization** — do this after the product is complete, not before
