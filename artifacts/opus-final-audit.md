# Final Codebase Audit

Read-only scan of `src/`, `api/`, `app/`, `backend/`. Issues listed by severity with file, line, and description.

---

## CRITICAL

### 1. Missing `return` on response calls — `api/send-welcome.ts:116,119`
Both `jsonOk()` (line 116) and `jsonError()` (line 119) lack `return`. If `sendWelcomeEmail()` succeeds, the function doesn't exit — it falls through. In practice the `try/catch` structure prevents double-send here, but the missing `return` is inconsistent with every other handler and would cause "headers already sent" errors if any code were added after the try/catch block.

### 2. Unsafe `as string` cast on Stripe `customer` fields — `api/_stripeWebhook.ts:142,215,260,309,338`
`session.customer`, `subscription.customer`, `invoice.customer` are all typed `string | Stripe.Customer | Stripe.DeletedCustomer | null` in Stripe SDK v20. The code blindly casts with `as string`. If Stripe ever expands the customer object in a webhook payload, these become `"[object Object]"` strings passed to database queries. Should use a helper like `typeof x === 'string' ? x : x?.id`.

### 3. Devices type definition missing quiet-hours fields — `app/src/types/database.ts:99-121`
The `devices` table type is missing `quiet_start`, `quiet_end`, and `utc_offset_minutes` fields that are actively read/written in `app/app/(tabs)/settings.tsx:135-164`. TypeScript either isn't catching this (if the query result is typed as `any`) or the fields are accessed unsafely.

---

## HIGH

### 4. Case-sensitive email self-invite check — `api/invite-member.ts:50`
`profile.email === normalizedEmail` compares the inviter's stored email (potentially mixed-case from OAuth) against the lowercased invite target. A user with `Ben@Example.com` stored in their profile could invite themselves as `ben@example.com` and bypass this guard. Fix: `profile.email?.toLowerCase() === normalizedEmail`.

### 5. Outbound webhook fetch has no timeout — `backend/supabase/functions/notify/index.ts:401`
`fetch(hook.url, ...)` has no `AbortSignal` timeout. A slow or hanging webhook target blocks the entire notify response. `Promise.allSettled` prevents crash but the function still waits indefinitely. Add `signal: AbortSignal.timeout(5000)`.

### 6. IP-based rate limiting is spoofable — `backend/supabase/functions/notify/index.ts:69-89`
`getClientIp()` trusts `x-forwarded-for`, `x-real-ip`, `cf-connecting-ip` headers directly. Unless Supabase Edge Functions strip/overwrite these headers upstream, an attacker can rotate IPs to bypass the in-memory rate limiter. Verify Supabase's header trust model.

### 7. Fire-and-forget errors silently swallowed — `backend/supabase/functions/notify/index.ts:686`
`checkQuotaWarning(...).catch(() => {})` discards all errors including unexpected ones. At minimum log: `.catch((e) => console.error("Quota warning failed:", e))`.

### 8. CORS origin check uses `startsWith` — `backend/supabase/functions/delete-account/index.ts:23`
`origin.startsWith("relay://")` allows any origin like `relay://evil.com`. Should check exact match `origin === "relay://app"` or whatever the actual app scheme+host is.

---

## MEDIUM

### 9. Quota check off-by-one — `backend/supabase/functions/notify/index.ts:565`
Check is `monthlyNotificationCount >= monthlyLimit` (blocks at limit), but the DB trigger also enforces the limit on insert. These are consistent, but the edge-function check happens BEFORE the insert, so a race between two concurrent requests at count=499 (limit=500) could allow both through the edge-function check. The DB trigger is the real enforcer, so this is defense-in-depth, but the race window exists.

### 10. DST not handled in quiet hours — `backend/supabase/functions/notify/index.ts:239-245`
`utc_offset_minutes` is stored as a static value. When DST transitions occur, quiet hours shift by 1 hour until the device re-registers. Users in DST-observing timezones get notifications during intended quiet time twice a year.

### 11. Stripe cleanup failure doesn't block account deletion — `backend/supabase/functions/delete-account/index.ts:104-167`
If Stripe customer/subscription deletion fails, account deletion proceeds. Orphaned Stripe customers could retain payment methods. The error is logged but user has no way to know cleanup was incomplete.

### 12. `heartbeat-check.ts` uses `any` type — `api/heartbeat-check.ts:11`
`function isStale(app: any)` has zero type safety. Should use a typed interface matching the select query shape from line 39.

### 13. No abort on manifest fetch — `app/app/edit-app.tsx:71-114`
Rapid URL changes trigger multiple concurrent fetches with no cancellation of stale requests. An older response arriving after a newer one overwrites the form state with stale manifest data. Use `AbortController` cleanup in the effect.

### 14. Clipboard API no try-catch — `src/features/dashboard/useDashboardPage.ts:320`
`navigator.clipboard.writeText()` can throw if clipboard access is denied (e.g., iframe, older browser). Wrap in try-catch.

---

## LOW

### 15. `1440` magic number — `backend/supabase/functions/notify/index.ts:240`
`(now.getUTCHours() * 60 + now.getUTCMinutes() + utcOffsetMinutes + 1440) % 1440` — extract `MINUTES_PER_DAY = 1440`.

### 16. Redundant `Boolean()` wrapper — `api/stripe-webhook.ts:100`
`deleted: Boolean("deleted" in customer && customer.deleted)` — the `&&` already produces a boolean. Simplify to `"deleted" in customer && customer.deleted === true`.

### 17. Hardcoded Postgres error code — `api/_stripeWebhook.ts:382`
`processed.errorCode !== "PGRST116"` is a PostgREST-specific code for "no rows found". Fragile if PostgREST changes error codes. Consider checking a more stable signal.

### 18. `process-receipts` missing pagination — `backend/supabase/functions/process-receipts/index.ts:63`
`.limit(1000)` without offset/cursor. If >1000 pending tickets accumulate, the oldest are never processed.

### 19. Channel name collisions possible — `backend/supabase/functions/notify/index.ts:160-165`
`sanitizeChannel()` converts all non-alphanumeric chars to hyphens. `user@email.com` and `user.email.com` both become `user-email-com`.

---

## Already Fine (Agent False Positives Dismissed)

- **`send-welcome.ts:116,119`**: The missing `return` is real but won't cause double-send because the try/catch structure prevents fallthrough between the two calls. Still should be fixed for correctness.
- **`_email.ts` accent color**: The email template intentionally uses green for CTA buttons — this is a design choice, not a bug.
- **`accept-invite.ts:58` null deref**: `user.email` comes from `getAuthenticatedUser` which validates it. Not a real issue.
- **Array key index in `App.tsx:243`**: These are static demo grid items that never reorder. Index keys are fine here.
