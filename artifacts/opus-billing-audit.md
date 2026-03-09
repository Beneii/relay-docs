# Billing Security Audit

## Files Reviewed
- `api/stripe-webhook.ts` — Stripe webhook handler
- `api/create-billing-portal.ts` — Billing portal session creation
- `api/create-checkout.ts` — Checkout session creation
- `api/_auth.ts` — Auth helper (JWT verification via Supabase `getUser`)
- `api/_cors.ts` — CORS configuration
- `src/pages/Dashboard.tsx` — Frontend billing portal caller

## Bugs Fixed

### 1. CRITICAL: checkout.session.completed silently fails when client_reference_id is null
**File:** `api/stripe-webhook.ts` lines 99-125
- **Before:** If `session.client_reference_id` was null (e.g., Stripe test mode, manual subscription creation, or a checkout link without the param), the entire `if (userId)` block was skipped. The user paid but never got upgraded. The event was marked as processed (line 281), so Stripe would never retry. Money collected, no upgrade delivered.
- **Fix:** Added an `else` branch that falls back to matching the profile by `session.customer_details.email` or `session.customer_email`. If no email is available either, returns 500 so Stripe retries. Logs the issue in all cases for operational visibility.

### 2. Webhook error message leaks Stripe internals
**File:** `api/stripe-webhook.ts` line 79
- **Before:** `res.status(400).send(\`Webhook Error: ${err.message}\`)` — exposed Stripe SDK error details (signature algorithm, expected vs actual signatures) to anyone probing the endpoint.
- **Fix:** Log the error server-side, return a generic `"Invalid signature"` to the caller.

### 3. Billing portal accepted client-supplied customerId (IDOR vector)
**File:** `api/create-billing-portal.ts` lines 40-57
- **Before:** The endpoint accepted `customerId` from the request body, then validated ownership by looking up the user's profile and comparing. While the check was correct, accepting a client-supplied Stripe customer ID at all is unnecessary — the server knows the user's customer ID from their profile. If the validation logic ever had a bug (e.g., type coercion, null comparison), it would become a direct IDOR allowing any user to access any customer's billing portal.
- **Fix:** Removed `customerId` from request body entirely. The endpoint now looks up `stripe_customer_id` from the authenticated user's profile server-side. Returns 404 if no billing account exists.
- **Frontend updated:** `src/pages/Dashboard.tsx` no longer sends `customerId` in the request body.

## Verified Correct (No Changes Needed)

### create-checkout.ts
- Authenticates user via `getAuthenticatedUser` (JWT verification).
- Validates `annual` is a boolean (prevents injection).
- Checks profile exists and isn't already Pro (prevents double-charge).
- Uses `client_reference_id: userId` to link checkout to user.
- Reuses existing Stripe customer if `stripe_customer_id` is set, otherwise uses `customer_email`.
- Error response doesn't leak Stripe error details (logs truncated message server-side, returns generic error).

### stripe-webhook.ts — Signature Verification
- Uses `stripe.webhooks.constructEvent` with raw body + signature header.
- `bodyParser: false` ensures raw body is available (required for signature verification).
- Webhook secret from environment variable (not hardcoded).

### stripe-webhook.ts — Idempotency
- Checks `processed_stripe_events` table before processing.
- Records event ID only AFTER successful processing (line 281).
- If business logic fails (returns 500), event is NOT recorded — Stripe will retry.
- Minor: Two concurrent deliveries of the same event could both pass the check, but the business logic is idempotent (same update values), and the second insert would fail on unique constraint.

### stripe-webhook.ts — subscription.created/updated
- Updates profile by `stripe_customer_id` match.
- Has backfill logic if no match (retrieves customer from Stripe, matches by email with `stripe_customer_id IS NULL` guard). Handles the race where this event arrives before `checkout.session.completed` sets the customer ID.
- Correctly maps subscription status: `active`/`trialing` → pro, everything else → free.
- Stores billing metadata: `billing_interval`, `current_period_end`, `cancel_at_period_end`.

### stripe-webhook.ts — subscription.deleted
- Downgrades to free, clears subscription metadata.
- Sends cancellation email.

### stripe-webhook.ts — invoice.paid
- Confirms pro status and syncs billing metadata.
- Has email fallback matching (same pattern as subscription handler).

### stripe-webhook.ts — invoice.payment_failed
- Sends payment failed email. No plan change (correct — Stripe handles dunning).

### Auth helper (_auth.ts)
- Uses `supabase.auth.getUser(token)` to verify JWT server-side (not just decoding — makes a request to Supabase auth server).
- Service role client configured with `autoRefreshToken: false, persistSession: false` (correct for serverless).

### CORS (_cors.ts)
- Allows `relayapp.dev` and `localhost:*` origins only.
- Returns `Vary: Origin` header (correct for CDN caching with dynamic origin).

## Architecture Notes

### Event ordering resilience
The webhook handler is designed to handle out-of-order Stripe events:
- `checkout.session.completed` sets `stripe_customer_id` on the profile
- `customer.subscription.created` may arrive before or after; has email-based backfill
- `invoice.paid` also has email-based backfill
- All paths converge on the same result: profile has `plan: 'pro'` + `stripe_customer_id`

### Sign-out flow and billing
The billing portal and checkout endpoints require a valid JWT. After sign-out, these endpoints can't be called. The Stripe customer portal link is one-time-use (expires), so there's no risk of a stale link being used after sign-out.
