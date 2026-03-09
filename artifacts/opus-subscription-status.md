# Subscription Status Display

## Files Modified
- `app/app/(tabs)/settings.tsx` — Added subscription status to plan card

## Changes Made

### Settings screen now shows subscription details for Pro users

**Before:** Pro users saw only an "Active" badge, usage stats, and a "Manage billing" button. No indication of billing interval, renewal date, or pending cancellation.

**After:** The plan card now shows:

1. **Cancellation-aware badge**: Shows "Active" (accent color) normally, or "Canceling" (warning color) when `cancel_at_period_end` is true.

2. **Billing interval**: Displays "Monthly plan" or "Annual plan" based on `profile.billing_interval`.

3. **Renewal/end date**: Shows "Renews {date}" normally, or "Ends {date}" (warning color) when canceling. Uses `toLocaleDateString` with short month format (e.g., "Renews Mar 15, 2026").

### Layout
The subscription info row sits between the plan header (name + badge) and the usage stats row. Uses `flexDirection: "row"` with `justifyContent: "space-between"` to place the interval on the left and the date on the right.

## Verified Correct

### useProfile hook
- Uses `select("*")` which returns all profile columns including the billing fields added in the types audit (`stripe_subscription_id`, `billing_interval`, `current_period_end`, `cancel_at_period_end`, `welcome_email_sent`).
- No changes needed to the hook — the data was already being fetched, just not displayed.

### Data flow
- `stripe-webhook.ts` sets `billing_interval`, `current_period_end`, and `cancel_at_period_end` on every `customer.subscription.created/updated` and `invoice.paid` event.
- `cancel_at_period_end` is set to `true` when the user cancels via the Stripe billing portal (Stripe fires `customer.subscription.updated` with `cancel_at_period_end: true`).
- When the period actually ends, Stripe fires `customer.subscription.deleted`, which downgrades to free and clears all billing fields.
