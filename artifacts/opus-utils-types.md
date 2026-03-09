# Utils & Types Audit

## Files Reviewed
- `app/src/utils/time.ts` — Relative time formatting
- `app/src/utils/url.ts` — URL validation and hostname extraction
- `app/src/utils/webhook.ts` — Webhook token generation
- `app/src/types/database.ts` — TypeScript types for Supabase tables

## Bugs Fixed

### 1. timeAgo returned "0mo ago" and "0y ago" for certain day ranges
**File:** `app/src/utils/time.ts`
- **Before:** Used a weeks bucket (`weeks < 4`) before months. Days 28-29: `weeks=4` fell through to months where `floor(28/30)=0` → `"0mo ago"`. Days 360-364: `months=12` fell through to years where `floor(364/365)=0` → `"0y ago"`.
- **Fix:** Removed the weeks bucket. Now uses days directly up to 30, then months up to 12, then years. Transitions: `<60s` → just now, `<60m` → Xm, `<24h` → Xh, `<30d` → Xd, `<12mo` → Xmo, else → Xy. No gaps.

### 2. ProfileRow missing 5 database columns
**File:** `app/src/types/database.ts`
- **Before:** Profile type only had `id, email, plan, stripe_customer_id, created_at, updated_at`.
- **Missing fields** (all set by `api/stripe-webhook.ts`):
  - `stripe_subscription_id: string | null`
  - `billing_interval: "month" | "year" | null`
  - `current_period_end: string | null`
  - `cancel_at_period_end: boolean`
  - `welcome_email_sent: boolean`
- **Impact:** Any code accessing `profile.billing_interval` or `profile.cancel_at_period_end` etc. had no type safety — TypeScript wouldn't catch typos or wrong types. The settings screen already accesses the profile but only uses `plan`, so no runtime errors existed yet. However, any future use of billing fields (e.g., showing "cancels on {date}" in settings) would need these types.
- **Fix:** Added all 5 fields to Row, Insert, and Update types. Used `"month" | "year"` union for `billing_interval` to match Stripe's interval values.

## Verified Correct (No Changes Needed)

### url.ts — validateUrl
- Correctly auto-prepends `https://` for bare hostnames.
- Private IP detection covers: localhost, 127.x, 10.x, 192.168.x, 172.16-31.x, 100.64-127.x (Tailscale CGNAT), .local, .internal, .ts.net.
- Blocks `http://` on public URLs, allows it on private addresses with a warning.
- `extractHostname` has try/catch fallback returning the raw input on parse failure.

### url.ts — Private range regex verification
- `172.(1[6-9]|2\d|3[01])` matches 16-31 — correct for RFC 1918.
- `100.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])` matches 64-127 — correct for RFC 6598 (CGNAT).

### webhook.ts — generateWebhookToken
- Uses `expo-crypto getRandomBytes(32)` — cryptographically secure PRNG.
- Produces 64 hex characters (256 bits of entropy) — more than sufficient for webhook authentication.
- No timing or collision concerns (crypto-random, not UUID).
