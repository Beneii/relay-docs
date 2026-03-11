# Critical Fixes

## 1. `api/send-welcome.ts` — Missing returns + race condition

**Problem**: `jsonOk()` (line 116) and `jsonError()` (line 119) lacked `return` statements. Also, concurrent signup webhook + frontend calls could send duplicate welcome emails.

**Fix**:
- Added `return` before both response calls
- Replaced check-then-send with atomic claim: `UPDATE profiles SET welcome_email_sent=true WHERE id=? AND welcome_email_sent=false`, then check if any row was updated. If 0 rows claimed, skip (another request already won).
- Added rollback: if `sendWelcomeEmail()` throws, reset `welcome_email_sent=false` so a retry can succeed.

## 2. `api/_stripeWebhook.ts` — Unsafe `as string` casts on Stripe customer fields

**Problem**: Lines 142, 215, 260, 309, 338 all cast `session.customer`, `subscription.customer`, `invoice.customer` with `as string`. In Stripe SDK v20 these are `string | Stripe.Customer | Stripe.DeletedCustomer | null`. If Stripe sends an expanded object, the cast produces `"[object Object]"`.

**Fix**:
- Added `resolveStripeId(field)` helper that does `typeof === 'string'` check, falls back to `.id` property, returns `null` if neither works.
- Replaced all 5 `as string` casts with `resolveStripeId()`.
- Added null guards after each resolve — if `customerId` is null, log and return early instead of passing garbage to DB queries.
- Exception: `checkout.session.completed` allows null `customerId` since `stripe_customer_id` is nullable in the DB.

## 3. `app/src/types/database.ts` — Missing device fields

**Problem**: `devices` table type definition was missing `quiet_start`, `quiet_end`, and `utc_offset_minutes` fields that are read/written in `settings.tsx`.

**Fix**: Added all three fields to `Row`, `Insert`, and `Update` types:
- `quiet_start: string | null`
- `quiet_end: string | null`
- `utc_offset_minutes: number | null`

## Typecheck

- `npx tsc -p tsconfig.json --noEmit` — clean
- `app/` typecheck has 1 pre-existing error in `useNotifications.ts` (unrelated)
