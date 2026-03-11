# Loop 6 Implementation: Compose Notifications + Quota Warning Emails

## RESULT
All tasks implemented. Typecheck passes clean.

## FILES CHANGED

### Task 1: Compose Notification Modal

1. **`src/features/dashboard/ComposeNotificationModal.tsx`** (created)
   - Full compose modal: dashboard selector, title (required, 200 char limit with counter), body (optional, 2000 char limit with counter), severity dropdown, channel input, URL input
   - Loading state during send, success state with "Send another" button, error state with message
   - POSTs to Supabase notify edge function using the selected dashboard's webhook token

2. **`src/features/dashboard/DashboardListSection.tsx`** (modified)
   - Added `Send` icon import and `onShowComposeModal` prop
   - Added "Compose" button next to "Add Dashboard" in header (only shown when dashboards exist)

3. **`src/features/dashboard/useDashboardPage.ts`** (modified)
   - Added `showComposeModal` / `setShowComposeModal` state

4. **`src/pages/Dashboard.tsx`** (modified)
   - Imported `ComposeNotificationModal`
   - Destructured `showComposeModal` / `setShowComposeModal`
   - Passed `onShowComposeModal` to `DashboardListSection`
   - Rendered `ComposeNotificationModal` when `showComposeModal` is true

### Task 2: Quota Warning Emails

5. **`backend/supabase/migrations/00017_quota_warnings.sql`** (created)
   - Adds `quota_warning_80_sent_at` and `quota_warning_100_sent_at` timestamptz columns to profiles

6. **`backend/supabase/functions/notify/index.ts`** (modified)
   - Added `sendQuotaEmail()` — sends email directly via Resend API from Deno (no Vercel dependency)
   - Added `checkQuotaWarning()` — checks usage percentage, deduplicates with profile columns, sends 80% or 100% warning
   - Fire-and-forget call after notification insert (`.catch(() => {})` so it never blocks the response)
   - 80% warning: re-sends if last sent >30 days ago; 100% warning: sends once per period

## OUTPUT
```
> relay-site@1.0.0 typecheck
> tsc -p tsconfig.json --noEmit
```
(clean pass, no errors)

## CONFIDENCE
9/10 — Both features are complete and type-safe. Compose modal follows existing modal patterns exactly. Quota emails use direct Resend API calls from Deno (avoiding the Vercel route limitation noted in the spec). Only uncertainty is the `email` field on profiles — the quota check queries it separately so it doesn't affect the existing profile lookup.
