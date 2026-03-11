# Hardening Audit & Fixes — Gemini Council

### 1. Action URL Validation Audit
- **Location:** `backend/supabase/functions/notify/index.ts`
- **Finding:** The `isHttpsUrl` function correctly enforces the `https:` protocol for all notification action URLs. This inherently blocks `javascript:`, `data:`, and other non-HTTPS schemes.
- **Fixes:** No changes needed to the protocol check. Note: While it doesn't block private IPs, action callbacks originate from the user's mobile device, posing no direct risk to Relay's server-side infrastructure.

### 2. Outbound Webhooks Section Polish
- **Location:** `src/features/dashboard/OutboundWebhooksSection.tsx`
- **Finding:** The section was calling the `load()` function (which fetches from the API) even if the user was not on a Pro plan. This resulted in unnecessary API calls and potentially obscured error states.
- **Fix applied:** Updated `handleToggle` to only trigger the `load()` function if `isPro` is true. Free users now only see the upgrade banner without triggering background fetches.

### 3. App Deletion Error Handling (Mobile)
- **Location:** `app/src/hooks/useApps.ts`, `app/app/edit-app.tsx`, `app/app/(tabs)/index.tsx`
- **Finding:** The mobile app was not providing feedback when a dashboard deletion failed. Specifically, deletions would fail silently if an app had active team members (due to foreign key constraints).
- **Fixes applied:**
    - Updated `useDeleteApp` hook to catch Supabase error `23503` and provide a user-friendly message: *"Cannot delete app while it still has active team members. Remove all members first."*
    - Added `try/catch` block to `handleDelete` in `edit-app.tsx` to surface this (and other) errors via an `Alert`.
    - Added an `onError` callback to the long-press delete action in `index.tsx` to ensure errors are surfaced on the home screen as well.
