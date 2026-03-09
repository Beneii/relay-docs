# Duplicate Audit: Auth & Billing Logic

## 1. Auth Callback Comparison
### `src/pages/AuthCallback.tsx` vs `auth/callback.html`

| Feature | `src/pages/AuthCallback.tsx` | `auth/callback.html` (Updated) |
|---------|-----------------------------|-------------------------------|
| **Environment** | React / SPA | Plain HTML/JS (Static) |
| **Mobile Handoff** | Uses `searchParams` (`t`, `r`, `to`) | Uses `searchParams` & `hashParams` |
| **Open Redirect Fix** | **No** (Directly uses `to` param) | **Yes** (Validates path starts with `/` but not `//`) |
| **Token Leakage** | High (Query params only) | Lower (Supports/Prefers hash fragment) |
| **Deep Linking** | No | Yes (`relay://auth-callback`) |

**Most Correct/Secure Version:** `auth/callback.html` is more secure due to redirect validation and support for hash fragments, though it is used for static hosting/deep linking. `src/pages/AuthCallback.tsx` needs the same security fixes applied.

---

## 2. Stripe Webhook Comparison
### `api/stripe-webhook.ts` vs `docs/site/api/stripe-webhook.ts`

| Feature | `api/stripe-webhook.ts` | `docs/site/api/stripe-webhook.ts` |
|---------|------------------------|----------------------------------|
| **Event Types** | `checkout.completed`, `subscription.deleted`, `payment_failed` | `checkout.completed`, `subscription.deleted` |
| **Email Notifications**| Yes (Pro upgrade, Cancelled, Failed) | No |
| **Error Handling** | Robust (Logs errors, returns 500 on DB failure) | Minimal (Ignored DB errors) |
| **Profile Sync** | Updates `plan` and `stripe_customer_id` | Updates `plan` and `stripe_customer_id` |

**Most Correct/Secure Version:** `api/stripe-webhook.ts` is the definitive version. It handles more event types, includes user notifications, and has proper error checking. The version in `docs/site/` is a stripped-down, outdated duplicate.

---

## 3. Billing Portal Comparison
### `api/create-billing-portal.ts` vs `docs/site/api/create-billing-portal.ts`

| Feature | `api/create-billing-portal.ts` | `docs/site/api/create-billing-portal.ts` |
|---------|-------------------------------|-----------------------------------------|
| **Authentication** | **Required** (via `getAuthenticatedUser`) | **None** (Accepts any `customerId`) |
| **Authorization** | **Verified** (Checks if ID belongs to user) | **None** (IDOR vulnerability) |
| **Dependencies** | Supabase, Stripe, Auth Lib | Stripe only |

**Most Correct/Secure Version:** `api/create-billing-portal.ts` is the only secure version. The `docs/site/` version is extremely dangerous as it allows anyone to create a billing portal session for any Stripe customer ID (IDOR).

---

## Consolidation Plan

1.  **Auth Consolidation:**
    *   Apply `isValidRedirect` check to `src/pages/AuthCallback.tsx`.
    *   Update `src/pages/AuthCallback.tsx` to check `location.hash` for tokens, matching the logic in `auth/callback.html`.
    *   Consider if one of these can be removed or if they serve distinct entry points (Web vs Mobile).

2.  **API Consolidation:**
    *   **Delete** all files in `docs/site/api/`. These are outdated and insecure duplicates.
    *   Update `docs/site/` to either point to the main `api/` directory (if deployed together) or use the main `api/` as the single source of truth for deployment.
    *   Ensure `vercel.json` is configured to route all API requests to the root `api/` folder.

3.  **Codebase Hygiene:**
    *   Remove `dist/` and other build artifacts from version control if they exist (referenced in `find` results).
