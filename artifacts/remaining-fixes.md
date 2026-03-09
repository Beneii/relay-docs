# Remaining Fixes

Compiled: 2026-03-09
Sources: `artifacts/audit-backend.md`, `artifacts/audit-frontend.md`, mobile audit findings

Items already fixed are excluded. Only open issues remain.

---

## Blocker

_(none — duplicate migration numbers have been renumbered)_

---

## High Priority

### H1. Dashboard data-fetch failures show no error UI
- `src/pages/Dashboard.tsx` — profile, apps, and notification-count fetches all swallow errors. If any fail, the user sees empty or misleading state with no explanation or retry option.
- Profile-missing path (OAuth first-login race) auto-creates a profile but still renders with `user === null` if the create-then-refetch doesn't complete.

### H2. Dashboard app-delete is optimistic with no rollback
- `src/pages/Dashboard.tsx` — app is removed from local state immediately; if the backend delete fails, the user sees the app vanish but it still exists server-side. Uses `alert()` for errors — not visible on all platforms.

### H3. Frontend notification usage may disagree with backend near month boundaries
- Dashboard uses browser-local `new Date()` for month boundary; backend trigger uses server `date_trunc('month', now())`. Users near timezone edges may see misleading quota numbers or be blocked unexpectedly.

### H4. Signup welcome email doesn't fire when email confirmation is required
- `src/pages/Signup.tsx:106` — `send-welcome` only fires when `data.session?.access_token` exists, which it doesn't when Supabase requires email confirmation. Welcome email is skipped for the most common signup path.

---

## Medium Priority

### M1. `process-receipts`: `count: 'exact'` missing on expire update
- `backend/supabase/functions/process-receipts/index.ts` ~line 194 — `expiredCount` is always null; response shows `expired: 0`. Pass `{ count: 'exact' }` as second arg to `.update()`.

### M2. `notify`: No validation on `metadata_json` size/depth
- `backend/supabase/functions/notify/index.ts` ~line 258 — arbitrary JSONB accepted from external callers. Add size cap (e.g. 4KB) and max nesting depth.

### M3. `notify`: Internal error details leaked in responses
- Line 266: `details: notifError.message` exposes DB error messages to webhook callers.
- Line 351: `details: String(err)` exposes stack traces.
- Replace with generic error messages; log the real error server-side only.

### M4. `email.ts`: Pro upgrade email hardcodes "$7.99/month"
- `api/_lib/email.ts` ~line 190 — says "$7.99/month" regardless of whether the user chose the annual plan. Should be dynamic based on the billing interval, or use a generic message like "your Pro plan is now active".

### M5. `00005_device_constraints.sql`: Missing idempotency guards
- `ADD CONSTRAINT` will fail if re-run (no `IF NOT EXISTS` guard).
- `CREATE TRIGGER` will fail if re-run (no `DROP TRIGGER IF EXISTS` before create).
- `check_max_devices()` is not `SECURITY DEFINER` — works by accident due to RLS, but should be explicit for consistency.

### M6. `processed_stripe_events`: No cleanup job
- Table grows unbounded. Add a pg_cron job to delete events older than 30 days.

### M7. Post-checkout success UX is minimal
- `api/create-checkout.ts` redirects to `/dashboard?session_id=...`. Dashboard detects this and shows a success state, but should confirm the subscription is active by polling the profile rather than just displaying a static message.

### M8. Signup email input is not normalized
- `src/pages/Signup.tsx` — `email` is passed raw (no `.trim().toLowerCase()`). Login does normalize. Inconsistency can cause "account not found" on login if user signed up with trailing whitespace or mixed case.

### M9. Terms page lists unreleased features as included in Pro
- `src/pages/Terms.tsx:42` — lists "notification history, metadata events" as included in Pro. Pricing page correctly marks them "(coming soon)" but the legal terms do not qualify them. Could be a contractual issue.

### M10. `delete-account`: No confirmation step
- `backend/supabase/functions/delete-account/index.ts` — a single POST with a valid JWT deletes everything. Consider requiring re-authentication or a confirmation code.

---

## Low Priority

### L1. `notify`: In-memory rate limiting resets on cold start
- Deno edge function rate limit map is per-isolate. Acceptable for now but could be moved to Redis/KV for durability.

### L2. `register-device`: Inconsistent import source
- Uses `esm.sh` while all other edge functions use `jsr:`. Should standardize on `jsr:@supabase/supabase-js@2`.

### L3. `process-receipts`: Auth only checks Bearer prefix
- Line 33-39 — verifies a Bearer token exists but doesn't validate it's the service role key. Low risk since the function is only called by pg_cron.

### L4. Stripe/Supabase clients initialized with `|| ''` fallback
- Multiple API files: `new Stripe(process.env.STRIPE_SECRET_KEY || '')`. Should fail fast with `!` assertion or startup check instead of producing confusing runtime errors.

### L5. `delete-account`: CORS could be tightened
- Uses `Access-Control-Allow-Origin: *` — acceptable since JWT-gated, but could restrict to `relayapp.dev` + app scheme.

### L6. Ensure `customer.subscription.created` registered in Stripe dashboard
- The handler was added but the Stripe webhook configuration may not include this event type. Manual check required.

### L7. `src/lib/supabase.ts` creates client with blank env vars
- Misconfiguration becomes confusing runtime errors instead of a clear startup failure.

### L8. `api/send-welcome.ts` can be re-triggered by authenticated users
- Has a 5-minute signup window guard now, but within that window a user could call it multiple times. Low risk.

### L9. Pricing page uses `any` for profile shape
- `src/pages/Pricing.tsx:9` — weakens type checking where billing state is rendered.

### L10. Bundle size (~638 kB pre-gzip)
- Large for a marketing + auth app. Consider code-splitting or lazy-loading dashboard/pricing routes.

### L11. OAuth callback depends on static file + Vercel rewrite
- `/auth/callback` works in production via `public/auth/callback.html` + Vercel rewrite but is fragile for local dev and non-Vercel hosting.

### L12. `00005_push_tickets.sql` pg_cron relies on app.settings
- `current_setting('app.settings.supabase_url')` and `current_setting('app.settings.service_role_key')` are not set by default on all Supabase projects. Cron job will fail silently if unconfigured.

---

## Info / Manual Checks

- Verify `customer.subscription.created` is registered in Stripe webhook dashboard (L6)
- Verify `delete-account` email logging doesn't violate privacy policy
- Consider scoped `tsconfig` for website/API surface so `tsc --noEmit` is meaningful
