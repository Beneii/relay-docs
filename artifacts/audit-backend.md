# Backend Quality Audit

Audited: 2026-03-09
Scope: `backend/supabase/functions/`, `backend/supabase/migrations/`, `api/`

---

## 1. Migrations

### Duplicate migration numbers (Blocker)

Two files share the `00005` prefix and two share `00006`:

| Number | File A | File B |
|--------|--------|--------|
| 00005 | `00005_push_tickets.sql` | `00005_device_constraints.sql` |
| 00006 | `00006_billing_columns.sql` | `00006_stripe_idempotency.sql` |

Supabase applies migrations in lexicographic order. With identical prefixes, execution order depends on the suffix sort (`_billing_columns` < `_device_constraints` < `_push_tickets` < `_stripe_idempotency`). This is fragile and confusing. **Renumber before deploying:**

```
00005_push_tickets.sql
00006_device_constraints.sql
00007_billing_columns.sql
00008_stripe_idempotency.sql
```

### 00001_initial_schema.sql — OK with notes

- **RLS INSERT policy on notifications** now correctly scoped to `service_role` (modified in-place). The original `WITH CHECK (true)` was also fixed by 00003, so the in-place edit and the migration are redundant. Not a bug, just noise.

### 00002_add_plan_and_stripe.sql — OK

- Idempotent `ADD COLUMN IF NOT EXISTS`, guarded constraint. Clean.

### 00003_fix_notification_rls.sql — OK

- Correctly drops and recreates the INSERT policy with `TO service_role`. Idempotent.

### 00004_quota_triggers.sql — OK (fixed)

- `month_start` now uses `date_trunc('month', now())` unconditionally. Correct.
- Functions are `SECURITY DEFINER` with `SET search_path = public`. Correct.
- `BEFORE INSERT` trigger logic is correct (counts existing rows, blocks at >= limit).

### 00005_push_tickets.sql — Minor issue

- Table, indexes, RLS all correct.
- **pg_cron schedule relies on `current_setting('app.settings.supabase_url')` and `current_setting('app.settings.service_role_key')`**. These are NOT set by default on all Supabase projects. If not configured, the cron job will fail silently at runtime. Needs documentation or a fallback check.

### 00005_device_constraints.sql — Missing idempotency guards

- `ADD CONSTRAINT devices_expo_push_token_check` will fail if re-run (no `IF NOT EXISTS` guard).
- `CREATE TRIGGER on_device_insert` will fail if re-run (no `DROP TRIGGER IF EXISTS` before create).
- `check_max_devices()` function is not `SECURITY DEFINER` — runs as the calling role. Since RLS is enabled and the trigger fires on behalf of `authenticated` users, the `SELECT count(*)` inside the trigger may be filtered by RLS (user can only see their own devices, so this actually works correctly by accident). But for consistency with the other triggers, should be `SECURITY DEFINER SET search_path = public`.

### 00006_billing_columns.sql — OK

- All 4 columns correct. CHECK constraint guarded. Idempotent.

### 00006_stripe_idempotency.sql — OK

- Table, index, RLS all correct. `IF NOT EXISTS` on table. Clean.

---

## 2. Supabase Edge Functions

### notify/index.ts — Production-ready with minor issues

**Good:**
- Rate limiting per IP (60/min)
- Payload size limits (10KB)
- Input sanitization (title/body length)
- Webhook token validation (min 32 chars)
- Server-side quota enforcement (plan, app count, notification count)
- Push ticket storage for receipt processing
- Service role client for all DB operations

**Issues:**

| # | Issue | Severity | Line(s) |
|---|-------|----------|---------|
| 1 | In-memory rate limiting resets on cold start | Low | 26 |
| 2 | `metadata_json` accepts arbitrary JSONB from external callers — no size or depth validation | Medium | 258 |
| 3 | `details: notifError.message` leaks internal DB error messages to external webhook callers | Low | 266 |
| 4 | `details: String(err)` in catch block leaks stack traces | Low | 351 |
| 5 | `CORS Allow-Origin: *` is correct for a public webhook endpoint | OK | 29 |

### register-device/index.ts — Production-ready

**Good:**
- JWT auth via anon key + `getUser()`
- Token format validation (`ExponentPushToken[` prefix)
- Platform validation (`ios`/`android`)
- Service role for upsert
- Conflict handling on `(user_id, expo_push_token)`

**Issues:**

| # | Issue | Severity | Line(s) |
|---|-------|----------|---------|
| 1 | Uses `https://esm.sh/@supabase/supabase-js@2` import while other functions use `jsr:@supabase/supabase-js@2` — inconsistent, esm.sh is less reliable | Low | 1 |
| 2 | No rate limiting — a malicious user could spam device registrations (mitigated by 10-device trigger in 00005_device_constraints) | Low | — |

### process-receipts/index.ts — Production-ready

**Good:**
- Auth header check
- Batches of 300 (Expo's recommended max)
- Handles partial failures (continues on Expo API errors)
- Deletes stale tokens on `DeviceNotRegistered`
- Expires old tickets after 72h
- Proper error logging throughout

**Issues:**

| # | Issue | Severity | Line(s) |
|---|-------|----------|---------|
| 1 | Auth check only verifies Bearer prefix exists, doesn't validate the token is actually the service role key | Low | 33-39 |
| 2 | `count` on expire update (line 194) requires `{ count: 'exact' }` option to return actual count — without it, `expiredCount` is null and result shows `expired: 0` always | Medium | 194 |
| 3 | `count` on device delete (line 180) has same issue — `totalDeleted` falls back to `tokens.length` which is correct, but by accident | Low | 180 |

### delete-account/index.ts — Production-ready

**Good:**
- JWT auth to verify identity
- Service role for destructive ops
- Stripe cleanup before DB deletion
- FK cascades handle all table cleanup atomically
- Stripe failures are non-blocking (logs + continues)
- No customer data left behind

**Issues:**

| # | Issue | Severity | Line(s) |
|---|-------|----------|---------|
| 1 | Logs `profile.email` on deletion (line 161) — acceptable for audit trail, but verify this doesn't violate your privacy policy | Info | 161 |
| 2 | No confirmation step — a single POST with a valid JWT deletes everything. Consider requiring the user to re-enter password or send a confirmation code | Medium | — |
| 3 | `CORS Allow-Origin: *` — acceptable since auth is JWT-gated, but could be tightened to `relayapp.dev` only | Low | 4 |

---

## 3. Vercel API Routes

### api/_lib/auth.ts — Production-ready

- Service role client with `autoRefreshToken: false, persistSession: false`. Correct for serverless.
- Case-insensitive header lookup. Good.
- `getUser()` validates the JWT against Supabase (not just decoding). Secure.

### api/_lib/cors.ts — Production-ready

- Origin whitelist: production domain + localhost pattern. Correct.
- `Vary: Origin` header set. Correct for CDN caching.
- Falls back to prod origin for unknown origins. Secure.

### api/_lib/email.ts — Production-ready with one issue

| # | Issue | Severity | Line(s) |
|---|-------|----------|---------|
| 1 | `RESEND_API_KEY` is not validated at startup — if missing, `new Resend(undefined)` silently creates a broken client that fails on first send | Low | 3 |
| 2 | Pro upgrade email hardcodes "$7.99/month" regardless of billing interval | Medium | 190 |

### api/create-checkout.ts — Production-ready

- Auth check, profile existence check, price ID validation all present.
- `client_reference_id` links checkout to user ID. Correct.

**Issue:**

| # | Issue | Severity | Line(s) |
|---|-------|----------|---------|
| 1 | Does not check if user is already on Pro — allows creating duplicate subscriptions for the same user | Medium | 42-51 |

### api/create-billing-portal.ts — Production-ready

- Auth check present.
- Verifies `customerId` belongs to the authenticated user. Secure (prevents IDOR).
- Clean implementation.

### api/stripe-webhook.ts — Production-ready (after prior fixes)

- All 5 event types handled.
- Idempotency guard (insert after processing) is correct.
- `count: 'exact'` on invoice.paid update is present.
- Signature verification via `constructEvent`. Secure.

**No remaining issues.**

### api/health.ts — Production-ready

- DB connectivity check.
- Version from package.json.
- `Cache-Control: no-store`. Correct.
- Graceful degradation on missing env vars.

### api/send-welcome.ts — Production-ready

- Dual auth: webhook secret for Supabase triggers, JWT for frontend calls.
- Email validation present.

---

## 4. Cross-Cutting Issues

### Missing `processed_stripe_events` cleanup (Medium)

The idempotency table grows unbounded. There's an index on `created_at` (00006_stripe_idempotency.sql line 11) with a comment about cleanup, but no actual cleanup job. Add a pg_cron job to delete events older than 30 days:

```sql
SELECT cron.schedule(
  'cleanup-processed-stripe-events',
  '0 3 * * *',
  $$DELETE FROM public.processed_stripe_events WHERE created_at < now() - INTERVAL '30 days'$$
);
```

### Stripe SDK initialized with empty string fallback (Low)

Multiple files: `new Stripe(process.env.STRIPE_SECRET_KEY || '')`. If the env var is missing, Stripe creates a client with an empty key that fails on every API call with a confusing error. Better to fail fast:

```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

Same pattern exists for Supabase clients in api/ files — `process.env.SUPABASE_SERVICE_ROLE_KEY || ''`.

### No webhook endpoint verification for Stripe (Info)

The Stripe webhook endpoint URL must be registered in the Stripe dashboard. Ensure `https://relayapp.dev/api/stripe-webhook` is configured with these events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

The new `customer.subscription.created` event was added in the handler but may not be registered in Stripe's webhook configuration.

---

## 5. Summary

### Blockers (fix before deploy)
1. Duplicate migration numbers (00005 x2, 00006 x2) — renumber

### High Priority
None remaining — prior reviews addressed the critical issues.

### Medium Priority
1. `notify`: No validation on `metadata_json` size/depth
2. `process-receipts`: `count: 'exact'` missing on expire update (line 194)
3. `create-checkout`: No duplicate subscription guard
4. `email.ts`: Pro upgrade email hardcodes "$7.99/month"
5. `delete-account`: No confirmation step (re-auth or code)
6. `processed_stripe_events`: No cleanup job — table grows unbounded
7. `00005_device_constraints.sql`: Missing idempotency guards

### Low Priority
1. `notify`: In-memory rate limiting resets on cold start
2. `notify`: Internal error details leaked in responses (lines 266, 351)
3. `register-device`: Inconsistent import source (esm.sh vs jsr)
4. `process-receipts`: Auth only checks Bearer prefix, not token validity
5. Stripe/Supabase clients initialized with `|| ''` instead of failing fast
6. `delete-account`: CORS could be tightened from `*` to `relayapp.dev`
7. Ensure `customer.subscription.created` is registered in Stripe dashboard
