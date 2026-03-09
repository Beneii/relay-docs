# Dashboard Billing Portal Fix

**File:** `src/pages/Dashboard.tsx`

## Already Fixed (in billing audit)

The `customerId` was already removed from the request body during the `opus-billing-audit` task. The frontend call at line 423 now sends `body: JSON.stringify({})` instead of `body: JSON.stringify({ customerId: user.stripe_customer_id })`.

The API endpoint (`api/create-billing-portal.ts`) was updated in the same task to look up `stripe_customer_id` server-side from the authenticated user's profile, eliminating the IDOR vector entirely.

No additional changes needed.
