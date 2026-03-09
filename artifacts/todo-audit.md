# Relay TODO Audit

Static code audit of the current repo state across the website, Expo mobile app, Vercel APIs, Supabase functions/schema, billing flows, auth flows, docs, and release assets.

## Scope reviewed

- Website: `src/**`, `public/**`, `auth/**`, `vercel.json`, `package.json`
- Mobile app: `app/**`
- Backend/API: `api/**`, `backend/supabase/**`
- Docs and duplicate surfaces: `README.md`, `docs/**`, `docs/site/**`, root SwiftUI app in `Relay/**`

## P0 — fix first

- [ ] Unify plan limits, pricing, and feature flags in one shared source of truth.
  - Website currently uses free = `3 dashboards / 100 notifications` in `src/pages/Dashboard.tsx:7`, `src/pages/Dashboard.tsx:8`, `src/pages/Pricing.tsx:143`, and `src/pages/Terms.tsx:41`.
  - Mobile currently uses free = `1 dashboard / 200 notifications` in `app/src/hooks/useProfile.ts:28`, `app/app/(tabs)/index.tsx:133`, and `app/app/(tabs)/settings.tsx:179`.
  - Backend notify enforcement currently uses free = `3 dashboards / 100 notifications` in `backend/supabase/functions/notify/index.ts:12` and `backend/supabase/functions/notify/index.ts:13`.
  - Stale duplicate site also uses `1 dashboard / 200 notifications` in `docs/site/src/pages/Pricing.tsx:107`.

- [ ] Lock down notification insertion RLS.
  - `backend/supabase/migrations/00001_initial_schema.sql:124` adds a notification insert policy with `WITH CHECK (true)`, which is not scoped to `service_role` and should not be left open to normal clients.

- [ ] Enforce quotas server-side instead of relying on UI-only limits.
  - Web dashboard blocks adds in the browser only in `src/pages/Dashboard.tsx:115`.
  - Mobile blocks adds in the UI only in `app/app/(tabs)/index.tsx:130`.
  - Device registration is not capped at all on the server side.
  - Today a user can exceed free-tier app/device limits by writing directly through the client, then only discover the problem later when notification delivery is blocked.

- [ ] Collapse the duplicated auth callback flow to one production implementation.
  - React route exists in `src/main.tsx:20` and `src/pages/AuthCallback.tsx:1`.
  - Production rewrite sends `/auth/callback` to a static HTML file in `vercel.json:11`.
  - Duplicate static callback copies exist in `auth/callback.html:1` and `public/auth/callback.html:1`.
  - This is a high drift risk for auth bugs and mobile handoff regressions.

- [ ] Remove or archive the stale duplicate website under `docs/site`.
  - It uses outdated limits and outdated billing behavior in `docs/site/src/pages/Pricing.tsx:27` and `docs/site/src/pages/Pricing.tsx:107`.
  - Its checkout call no longer matches the authenticated API contract because it sends `userId` and `email` instead of a bearer-authenticated request in `docs/site/src/pages/Pricing.tsx:34`.

- [ ] Decide which mobile codebase is canonical.
  - The repo contains a real Expo app under `app/**` and a separate placeholder SwiftUI template app in `Relay/ContentView.swift:11` and `Relay/RelayApp.swift:11`.
  - The SwiftUI app is not feature-complete and currently reads like an Xcode starter project.

## Website

- [ ] Add full dashboard management parity to the web app.
  - The web dashboard can add/delete/copy token, but it does not support editing an app, toggling notifications, setting icon/accent color, or copying the full webhook URL.
  - Current web surface is limited in `src/pages/Dashboard.tsx:111`, `src/pages/Dashboard.tsx:146`, and `src/pages/Dashboard.tsx:315`.
  - Mobile already supports richer app editing in `app/app/edit-app.tsx:74`, `app/app/edit-app.tsx:114`, and `app/app/edit-app.tsx:287`.

- [ ] Replace weak client-side webhook token generation on the website.
  - Web uses `Math.random()` in `src/pages/Dashboard.tsx:120`.
  - Mobile uses a stronger crypto-based generator in `app/src/utils/webhook.ts:7`.
  - Best fix: mint tokens server-side and never trust browser-generated secrets.

- [ ] Add URL validation on the web app to match mobile behavior.
  - Mobile has private/public URL validation and warnings in `app/src/utils/url.ts:30`.
  - The website add-dashboard form only relies on the browser `type="url"` field in `src/pages/Dashboard.tsx:367`.

- [ ] Implement notification history on the website or stop selling it there.
  - Website pricing still advertises notification history and metadata events as coming soon in `src/pages/Pricing.tsx:187`.
  - There is no website notification history page today.

- [ ] Implement metadata/event-type UI or stop storing it as an invisible paid feature.
  - Data is stored in `backend/supabase/functions/notify/index.ts:257` and `backend/supabase/functions/notify/index.ts:258`.
  - No website UI currently surfaces it.

- [ ] Add missing account-management flows on the website.
  - No forgot-password flow.
  - No resend-confirmation flow.
  - No self-serve account deletion or data export.
  - Current login/signup flows are limited to password auth + OAuth in `src/pages/Login.tsx:35`, `src/pages/Login.tsx:57`, and `src/pages/Signup.tsx:70`.

- [ ] Add a single canonical webhook example and endpoint story.
  - Marketing page pushes `https://relayapp.dev/webhook` in `src/App.tsx:12`.
  - README shows `functions/v1/notify/WEBHOOK_TOKEN` in `README.md:119`.
  - Curl docs show direct Supabase calls with token in the JSON body in `docs/CURL_EXAMPLES.md:8`.
  - The backend supports both body token and path token in `backend/supabase/functions/notify/index.ts:135`, but the product/docs should pick one canonical format.

- [ ] Add proper site/API QA automation.
  - Root `package.json:6` only has `dev`, `build`, and `preview`.
  - There is no root lint, typecheck, unit-test, or route smoke-test workflow for the website/API layer.

- [ ] Improve billing error handling UX on the website.
  - Pricing handles basic checkout errors in `src/pages/Pricing.tsx:41`, but dashboard billing portal failures only log to console in `src/pages/Dashboard.tsx:166`.

## Mobile app

- [ ] Scope React Query cache by user and clear it on sign-out/account switch.
  - Global cache keys are shared across users in `app/src/hooks/useApps.ts:7`, `app/src/hooks/useNotifications.ts:6`, and `app/src/hooks/useProfile.ts:6`.
  - The shared query client lives for the app lifetime in `app/app/_layout.tsx:15`.
  - Sign-out currently only signs out Supabase in `app/app/(tabs)/settings.tsx:103`.

- [ ] Rework push-token lifecycle for shared devices and sign-out.
  - Registration is one-shot per app process via `registered.current` in `app/src/hooks/usePushRegistration.ts:15`.
  - The token is written directly to `devices` in `app/src/hooks/usePushRegistration.ts:62`.
  - Sign-out does not detach or delete device rows.

- [ ] Use the `register-device` backend function or delete it.
  - Dedicated server-side device registration exists in `backend/supabase/functions/register-device/index.ts:14`.
  - The mobile app currently bypasses it and writes directly to the table in `app/src/hooks/usePushRegistration.ts:62`.
  - Pick one path and make it authoritative.

- [ ] Enforce device ownership and uniqueness more safely.
  - Current schema only guarantees `UNIQUE(user_id, expo_push_token)` in `backend/supabase/migrations/00001_initial_schema.sql:81`.
  - The same physical device token can therefore exist on multiple users, which is a bad fit for shared-device sign-in flows.

- [ ] Add native email confirmation/deep-link support for sign-up.
  - Mobile sign-up does not pass `emailRedirectTo` in `app/app/auth.tsx:65`.
  - Website sign-up does pass a redirect in `src/pages/Signup.tsx:88`.
  - Mobile users currently get a generic “confirm your email, then come back and sign in” flow instead of a real deep-link confirmation path.

- [ ] Refresh notifications and unread count when a push arrives.
  - Tap-routing exists in `app/src/hooks/useNotificationHandler.ts:32`.
  - The unread badge is driven by `useUnreadCount()` in `app/app/(tabs)/_layout.tsx:46`.
  - There is no invalidation/update path when new notifications arrive.

- [ ] Refresh notification state when the app returns to foreground.
  - This would also keep badge counts and list state in sync after background delivery.

- [ ] Add an invalid-app / unauthorized-app state in the edit screen.
  - The screen only blocks on loading in `app/app/edit-app.tsx:127`.
  - A failed lookup can fall through into a misleading empty form.

- [ ] Show real pull-to-refresh state in list screens.
  - The home and notifications tabs refresh, but current UX still needs explicit refreshing state polish.

- [ ] Refresh Settings notification permission status after returning from OS settings.
  - Status is loaded once in `app/app/(tabs)/settings.tsx:84`.
  - Opening settings happens in `app/app/(tabs)/settings.tsx:109`.

- [ ] Remove dead config and drift-prone hard-coded values in the mobile auth screen.
  - `app/app/auth.tsx:21` contains an unused hard-coded `SUPABASE_URL` constant.

- [ ] Improve in-app billing UX.
  - “Manage billing” currently just opens the website dashboard handoff in `app/app/(tabs)/settings.tsx:117`.
  - Consider a clearer flow for active subscription state, renewal date, and billing errors from inside the app.

- [ ] Surface event type / metadata in the mobile notification history if those fields are part of the paid feature set.
  - Notification UI currently shows title/body/app/time only in `app/app/(tabs)/notifications.tsx:25`.

- [ ] Add focused integration coverage for auth switching, push routing, and quota gating.
  - Existing test coverage is limited to utilities in `app/src/__tests__/time.test.ts:1` and `app/src/__tests__/url.test.ts:1`.

## Backend APIs and database

- [ ] Move all quota enforcement into server-side code and/or database guarantees.
  - App count is only blocked in client UI.
  - Device count is not server-enforced.
  - Notification count is enforced only inside notify delivery in `backend/supabase/functions/notify/index.ts:235`.

- [ ] Add a canonical server-side webhook token minting path.
  - Today token generation is duplicated across clients and inconsistent in strength.

- [ ] Use consistent environment resolution in every API route.
  - `api/_lib/auth.ts:5` supports `VITE_SUPABASE_URL || SUPABASE_URL`.
  - `api/health.ts:34` also supports both.
  - `api/create-checkout.ts:9`, `api/create-billing-portal.ts:9`, and `api/stripe-webhook.ts:12` currently only use `VITE_SUPABASE_URL`, which is brittle in server environments.

- [ ] Add request validation schemas for all API handlers.
  - Checkout, billing portal, and welcome-email handlers rely on ad hoc `req.body` access in `api/create-checkout.ts:30`, `api/create-billing-portal.ts:30`, and `api/send-welcome.ts:37`.

- [ ] Add explicit env validation and startup-time failures for critical secrets.
  - Stripe, Supabase service role, and Resend usage currently fail at request time rather than being centrally validated.

- [ ] Replace in-memory rate limiting in the notify function with a durable mechanism.
  - Current IP rate limiting uses an in-memory `Map` in `backend/supabase/functions/notify/index.ts:26`.
  - That is not reliable across cold starts or multiple instances.

- [ ] Process Expo push tickets/receipts and clean up dead tokens.
  - Notify sends directly to Expo in `backend/supabase/functions/notify/index.ts:303`.
  - It returns the immediate Expo response, but it does not process receipts, mark delivery status, or prune invalid tokens.

- [ ] Track push delivery status in the database.
  - Right now `notifications` only store the logical notification payload, not whether delivery succeeded or failed.

- [ ] Add retry/error handling around Expo push responses.
  - The current code does not check `pushRes.ok` before parsing the response in `backend/supabase/functions/notify/index.ts:303`.

- [ ] Expand the health endpoint to cover more than DB reachability.
  - `api/health.ts:37` only reports DB status.
  - Add Stripe/Resend/config health or at least separate readiness checks for critical subsystems.

- [ ] Add automated tests for Vercel APIs and Supabase edge functions.
  - There is currently no backend/API test suite in the repo root.

## Auth

- [ ] Choose the actual auth product model and align code/docs.
  - README still says “Email magic link” in `README.md:18`.
  - Release checklist still tests magic links in `docs/RELEASE_CHECKLIST.md:33`.
  - Actual app behavior is email/password + OAuth in `src/pages/Login.tsx:40`, `src/pages/Login.tsx:58`, and `app/app/auth.tsx:52`.

- [ ] Add password reset flow everywhere.
  - Missing on both web and mobile.

- [ ] Add resend-confirmation flow.
  - Missing on both web and mobile.

- [ ] Standardize profile creation around one source of truth.
  - Database trigger already creates profiles in `backend/supabase/migrations/00001_initial_schema.sql:17`.
  - Website also does manual profile upserts in `src/pages/Signup.tsx:105` and `src/pages/Dashboard.tsx:55`.
  - This should be centralized to avoid drift and race conditions.

- [ ] Add self-serve account deletion and data-export flows.
  - Terms and privacy pages promise deletion requests by email in `src/pages/Terms.tsx:76` and `src/pages/Privacy.tsx:63`, but there is no product flow.

- [ ] Decide whether to keep legacy query-param token support in the callback page.
  - Current callback HTML still accepts tokens from either hash or query params in `auth/callback.html:62` and `public/auth/callback.html:62`.
  - Current mobile handoff uses the safer hash-based flow in `app/src/components/UpgradePrompt.tsx:101`.
  - If backwards compatibility is no longer needed, remove query-param support to shrink the auth surface area.

## Billing

- [ ] Create one shared billing catalog.
  - Prices/features are duplicated across website pricing, mobile upgrade copy, and transactional emails in `src/pages/Pricing.tsx:78`, `app/src/components/UpgradePrompt.tsx:81`, and `api/_lib/email.ts:190`.

- [ ] Prevent duplicate checkout for already-active Pro users at the API layer.
  - The UI disables upgrade buttons, but `api/create-checkout.ts:53` will still create a subscription checkout session if called directly.

- [ ] Store full Stripe subscription state in the database.
  - Profiles currently only keep `plan` and `stripe_customer_id` in `backend/supabase/migrations/00002_add_plan_and_stripe.sql:3`.
  - Missing fields include subscription id, status, current period end, cancellation state, and billing interval.

- [ ] Add webhook idempotency / processed-event tracking.
  - `api/stripe-webhook.ts:71` handles incoming events directly but does not record processed event IDs.
  - Stripe retries can therefore cause duplicate emails and repeated side effects.

- [ ] Handle more Stripe lifecycle events.
  - Current webhook handling only covers `checkout.session.completed`, `customer.subscription.deleted`, and `invoice.payment_failed` in `api/stripe-webhook.ts:72`, `api/stripe-webhook.ts:98`, and `api/stripe-webhook.ts:119`.
  - Missing states include subscription updates, cancellations at period end, renewals, past_due/unpaid handling, and checkout expiration.

- [ ] Reflect annual billing and renewal state consistently.
  - Website pricing offers annual checkout in `src/pages/Pricing.tsx:11` and `src/pages/Pricing.tsx:48`.
  - Email copy and account state do not currently expose interval details.

- [ ] Add better user-visible billing state in the UI.
  - Show plan interval, next renewal date, cancellation status, payment failure status, and portal availability.

## Push notifications

- [ ] Enforce device limits on the backend.
  - Product copy promises device limits, but there is no server-side device cap.

- [ ] Add invalid-token cleanup and uninstall cleanup.
  - Device rows will otherwise accumulate forever.

- [ ] Add monitoring and alerting for push delivery failures.
  - Right now there is no operational visibility beyond function logs.

- [ ] Add per-app delivery controls on the website.
  - The schema supports `notifications_enabled`, and mobile can edit it in `app/app/edit-app.tsx:287`.
  - Website does not expose it.

- [ ] Add richer notification history UX.
  - Filtering, event-type display, metadata display, and read/unread workflows are still minimal.

- [ ] Add end-to-end tests for foreground, background, and cold-start routing.
  - The release checklist expects this behavior in `docs/RELEASE_CHECKLIST.md:26` through `docs/RELEASE_CHECKLIST.md:29`, but there is no automated coverage.

## Docs, release readiness, and repo hygiene

- [ ] Update docs to reflect the real auth flow.
  - README and release checklist still refer to magic links.

- [ ] Fill in missing store-submission metadata.
  - `docs/STORE_DESCRIPTION.md:39` and `docs/STORE_DESCRIPTION.md:42` still say privacy/support URLs are to be provided.

- [ ] Document the intended welcome-email trigger path.
  - `api/send-welcome.ts:20` says it can be called by a Supabase webhook or frontend.
  - Current docs do not clearly explain how that webhook should be configured or secured.

- [ ] Remove stale duplicated callback/static assets after picking a single callback implementation.

- [ ] Decide whether `docs/site` is archival, experimental, or should be deleted.

- [ ] Add root CI tasks for website/API quality gates.
  - Root package still lacks lint/test/typecheck scripts.

- [ ] Clean up placeholder native app artifacts if Expo is the shipping client.
  - `Relay/ContentView.swift:11` and `RelayTests/RelayTests.swift:13` are starter-template code, not product code.

## Suggested implementation order

- [ ] First pass: unify pricing/limits, fix RLS, kill duplicate callback/site drift, and choose a canonical mobile surface.
- [ ] Second pass: centralize server-side quota/token/device logic and harden Stripe/Expo delivery handling.
- [ ] Third pass: close auth/account-management gaps and add missing website parity.
- [ ] Fourth pass: add automated tests, release automation, and operational monitoring.

