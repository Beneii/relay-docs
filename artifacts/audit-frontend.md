# Frontend + API Audit

Scope reviewed:

- Frontend: `src/**`
- Vercel API routes: `api/**`
- Cross-surface dependencies that directly affect these flows: `vercel.json`, `public/auth/callback.html`, selected Supabase migrations

Validation performed:

- `npm run build` at repo root: passes
- `npx tsc --noEmit` at repo root: not usable as a frontend/API correctness check because the root `tsconfig.json` pulls in unrelated `app/**` and `backend/**` code and fails on those areas

## Overall assessment

The website is in decent shape for a polished marketing site plus basic auth/billing dashboard, and the Vercel API surface is small and readable. The biggest quality problems are not visual polish; they are flow completeness and deployment fragility:

- OAuth callback handling now depends on Vercel/static-file behavior rather than the React router, which is likely fine in production but weak in local/dev environments.
- The dashboard page still has several missing/error states and a couple of silent failures.
- Billing webhook logic is improving, but it still depends on non-atomic multi-event updates and ambiguous migration ordering.
- There is no scoped typecheck path for just the website/API surface.

## What looks solid

- Main public pages exist and are wired: home, login, signup, pricing, reset password, privacy, and terms via `src/main.tsx:17`.
- Pricing checkout has basic user-facing error handling in `src/pages/Pricing.tsx:51`.
- Password reset request and reset form exist end-to-end in `src/pages/Login.tsx:74` and `src/pages/ResetPassword.tsx:84`.
- API auth and CORS logic are at least centralized in `api/_lib/auth.ts:54` and `api/_lib/cors.ts:34`.
- Stripe webhook idempotency logic exists conceptually in `api/stripe-webhook.ts:71`.

## Critical findings

- Missing React catch-all route means unknown paths render nothing instead of a 404 page.
  - Evidence: `src/main.tsx:17`
  - Impact: bad URLs, stale links, and local callback mistakes fail as blank screens.

- OAuth callback is not a React route anymore and now depends on a static callback file plus a Vercel rewrite.
  - Evidence: `src/pages/Login.tsx:66`, `src/pages/Signup.tsx:62`, `src/main.tsx:17`, `vercel.json:11`, `public/auth/callback.html:1`
  - Impact: production can work, but local `vite` development and non-Vercel hosting are fragile because `/auth/callback` is not handled inside `src/`.

- Dashboard can render with `user === null` and no recovery path if the profile row is missing or delayed.
  - Evidence: `src/pages/Dashboard.tsx:67`, `src/pages/Dashboard.tsx:74`, `src/pages/Dashboard.tsx:88`, `src/pages/Dashboard.tsx:146`
  - Impact: first-load/profile-race scenarios can leave the page half-functional with no visible explanation; adding dashboards then silently no-ops because `handleAddDashboard` returns early.

- Dashboard delete-account errors are stored in shared `error` state but only rendered inside the “Add Dashboard” modal.
  - Evidence: `src/pages/Dashboard.tsx:132`, `src/pages/Dashboard.tsx:396`
  - Impact: if account deletion fails, the user may see no error at all because the delete modal closes and the add modal is not open.

## High-priority findings

- Dashboard initial data load does not handle fetch failures explicitly.
  - Evidence: `src/pages/Dashboard.tsx:67`, `src/pages/Dashboard.tsx:92`, `src/pages/Dashboard.tsx:101`
  - Impact: profile/apps/notification-count failures degrade into empty or misleading UI states instead of actionable errors.

- Dashboard delete flow optimistically removes apps without checking the delete result.
  - Evidence: `src/pages/Dashboard.tsx:186`
  - Impact: users can see an app disappear locally even if the backend delete failed.

- Dashboard billing portal flow has no `response.ok` check and no user-facing failure state.
  - Evidence: `src/pages/Dashboard.tsx:207`, `src/pages/Dashboard.tsx:215`, `src/pages/Dashboard.tsx:220`
  - Impact: API failures fall into console-only errors with no recovery guidance.

- Frontend notification usage math may disagree with backend quota enforcement near month boundaries.
  - Evidence: `src/pages/Dashboard.tsx:101`, `backend/supabase/migrations/00004_quota_triggers.sql:65`
  - Impact: the dashboard uses a browser-local month boundary while the backend quota trigger now uses server `now()`, so users near timezone edges may see misleading usage numbers.

- Pricing page swallows authenticated-profile load failures and degrades to a signed-out-looking UI.
  - Evidence: `src/pages/Pricing.tsx:9`, `src/pages/Pricing.tsx:15`, `src/pages/Pricing.tsx:23`
  - Impact: a signed-in user with a failed profile fetch may be shown “Sign in / Get Started” instead of their real account state.

- The website still advertises Pro features that do not have corresponding web UI.
  - Evidence: `src/pages/Pricing.tsx:187`, `src/pages/Pricing.tsx:188`, `src/pages/Terms.tsx:42`
  - Impact: “Notification history” and “Metadata events” are still effectively unfinished on the website.

- Signup welcome-email flow is incomplete for the common “email confirmation required” path.
  - Evidence: `src/pages/Signup.tsx:105`, `src/pages/Signup.tsx:106`, `api/send-welcome.ts:39`
  - Impact: `send-welcome` only fires from signup when `data.session?.access_token` exists, which often does not happen when email confirmation is required.

## Medium-priority findings

- Website auth input normalization is inconsistent.
  - Evidence: `src/pages/Login.tsx:43`, `src/pages/Signup.tsx:85`, `src/pages/Login.tsx:75`
  - Impact: whitespace/casing issues are handled in forgot-password but not in login/signup submit paths.

- `src/lib/supabase.ts` creates a client even when env vars are blank.
  - Evidence: `src/lib/supabase.ts:3`, `src/lib/supabase.ts:6`
  - Impact: misconfiguration becomes confusing runtime auth/API failures instead of a clear startup error.

- Pricing uses `any` for the user profile shape.
  - Evidence: `src/pages/Pricing.tsx:9`
  - Impact: this weakens TypeScript value checking exactly where billing state is rendered.

- Post-checkout success UX is unfinished.
  - Evidence: `api/create-checkout.ts:63`
  - Impact: checkout returns users to `/dashboard?session_id=...`, but the dashboard does not consume or acknowledge that query param.

- Reset password page doubles as a generic “change password if already signed in” page.
  - Evidence: `src/pages/ResetPassword.tsx:50`, `src/pages/ResetPassword.tsx:58`
  - Impact: not necessarily wrong, but the route semantics are broader than the page name suggests.

- The built JS bundle is large for a relatively small marketing/auth app.
  - Evidence: `npm run build` reports `dist/assets/index-*.js` at ~638 kB before gzip.
  - Impact: avoidable performance drag on first load.

## API findings

- `api/create-checkout.ts` does not block already-Pro users at the API layer.
  - Evidence: `api/create-checkout.ts:42`, `api/create-checkout.ts:53`
  - Impact: direct API calls can still create subscription checkout sessions even if the UI disables the button.

- `api/create-checkout.ts` always uses `customer_email` instead of reusing an existing Stripe customer.
  - Evidence: `api/create-checkout.ts:66`
  - Impact: returning customers can end up with multiple Stripe customer records.

- `api/create-checkout.ts` performs no schema validation on `annual`.
  - Evidence: `api/create-checkout.ts:30`
  - Impact: malformed request bodies are accepted until much deeper in the handler.

- `api/send-welcome.ts` can be used by any authenticated user to repeatedly trigger welcome emails to themselves.
  - Evidence: `api/send-welcome.ts:39`, `api/send-welcome.ts:52`
  - Impact: no dedupe, cooldown, or “first-signup-only” guard.

- `api/health.ts` reports `status: 'ok'` even when the DB is not configured.
  - Evidence: `api/health.ts:37`, `api/health.ts:46`, `api/health.ts:48`
  - Impact: this is a misleading health contract for operators and uptime checks.

- `api/_lib/auth.ts` silently bootstraps with empty env vars.
  - Evidence: `api/_lib/auth.ts:4`, `api/_lib/auth.ts:6`
  - Impact: auth failures become request-time behavior instead of explicit configuration errors.

- `api/stripe-webhook.ts` updates billing state across multiple event types rather than one atomic path.
  - Evidence: `api/stripe-webhook.ts:88`, `api/stripe-webhook.ts:115`, `api/stripe-webhook.ts:140`
  - Impact: account state can be partially updated depending on Stripe event ordering and transient failures.

- `customer.subscription.created` / `updated` updates do not backfill `stripe_customer_id`.
  - Evidence: `api/stripe-webhook.ts:125`
  - Impact: if these events arrive before checkout completion has persisted the customer ID, profile matching can fail silently.

- Stripe idempotency depends on a table that exists, but migration numbering is ambiguous.
  - Evidence: `api/stripe-webhook.ts:73`, `backend/supabase/migrations/00006_stripe_idempotency.sql:4`, `backend/supabase/migrations/00006_billing_columns.sql:1`
  - Impact: duplicate `00006_*` migration prefixes make deployment ordering unclear and can break webhook assumptions depending on migration tooling.

- More generally, migration ordering for backend dependencies is currently rough.
  - Evidence: `backend/supabase/migrations/00005_device_constraints.sql:1`, `backend/supabase/migrations/00005_push_tickets.sql:1`, `backend/supabase/migrations/00006_billing_columns.sql:1`, `backend/supabase/migrations/00006_stripe_idempotency.sql:1`
  - Impact: duplicate numeric prefixes are risky for reproducible environments.

## Broken or fragile route/link audit

- Internal React routes used in `src/` are otherwise consistent: `/`, `/login`, `/signup`, `/dashboard`, `/pricing`, `/reset-password`, `/privacy`, `/terms` all exist in `src/main.tsx:17`.
- Landing-page anchor links are internally consistent: `#features`, `#use-cases`, `#how-it-works`, `#api`, and `#faq` all exist in `src/App.tsx:390`, `src/App.tsx:428`, `src/App.tsx:585`, `src/App.tsx:632`, and `src/App.tsx:700`.
- The main fragile exception is `/auth/callback`, which is referenced from `src` but not routed in React; it only works via the static callback file and Vercel rewrite.

## TypeScript assessment

- The website frontend builds successfully through Vite.
- There is no clean, scoped TS check for just the website/API surface.
- The root `tsconfig.json` is too broad for this repo shape because it has no `include`/`exclude` boundaries and catches unrelated Expo/Supabase function code.
  - Evidence: `tsconfig.json:1`
- Within `src/` and `api/`, the biggest visible type roughness is selective `any` usage and missing typed profile shapes on some pages rather than widespread type unsafety.

## Recommended next fixes

1. Add a real `*` / 404 route in `src/main.tsx` and decide whether `/auth/callback` should be routed in React again for local/dev resilience.
2. Add explicit failure UI to dashboard initial loads, billing portal open, app delete, and account delete.
3. Tighten the dashboard profile-missing path so it retries or shows a blocking “profile still provisioning” state instead of rendering with `user === null`.
4. Add scoped TS scripts for the website/API surface, or split configs so `tsc --noEmit` is meaningful.
5. Add API request validation and env validation, especially in `create-checkout`, `create-billing-portal`, and `send-welcome`.
6. Rework Stripe webhook state updates to reduce event-order dependency and fix duplicate migration numbering.
7. Either implement web notification history / metadata views or stop advertising them as near-term product features.

