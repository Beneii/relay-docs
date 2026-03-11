# Codebase Cleanup Plan

Comprehensive audit of `src/`, `api/`, `app/`, `backend/`. Each item includes file path, line number, problem, and fix.

---

## P0 — Bugs & Security Gaps

### P0-01: Import extension breaks Vercel deployment
- **File:** `api/_billing.ts:4`
- **Problem:** Uses `.ts` extension in import instead of `.js`. Vercel's `nodeFileTrace` cannot resolve `.ts` imports at runtime — function will crash with `ERR_MODULE_NOT_FOUND`.
- **Fix:** Change `from './_cors.ts'` to `from './_cors.js'` (and any other `.ts` imports in this file).

### P0-02: Quota trigger uses wrong free limit
- **File:** `backend/supabase/migrations/00004_quota_triggers.sql:62`
- **Problem:** Hardcodes free notification limit as `100`. `shared/product.ts` defines it as `500`. Users hit a false quota wall at 100.
- **Fix:** Change `100` to `500` in the trigger function. Add a comment referencing `shared/product.ts` as source of truth.

### P0-03: Outbound webhooks migration constraints conflict with product config
- **File:** `backend/supabase/migrations/00020_outbound_webhooks.sql`
- **Problem:** `UNIQUE(app_id, provider)` constraint limits each app to 2 webhooks (one per provider). `PRO_LIMITS.outboundWebhooks` is `5`. Also missing a service_role UPDATE policy.
- **Fix:** Remove `UNIQUE(app_id, provider)` — replace with a check constraint or application-level validation. Add RLS policy: `CREATE POLICY "Service role can update webhooks" ON outbound_webhooks FOR UPDATE TO service_role USING (true)`.

### P0-04: Rules of Hooks violations (mobile)
- **File:** `app/app/edit-app.tsx:50`
- **Problem:** Hook (`useEffect` or similar) called after a conditional `return` statement. React hooks must be called unconditionally at the top level.
- **Fix:** Move all hooks above any conditional returns. Guard the effect body instead of the hook call.

- **File:** `app/app/app/[id].tsx:26`
- **Problem:** Same pattern — hook called after conditional return.
- **Fix:** Same — move hooks above returns, guard internally.

### P0-05: Stale test assertions
- **File:** `tests/shared/product.test.ts`
- **File:** `app/src/__tests__/limits.test.ts`
- **Problem:** Both assert `notificationsPerMonth === 100` when actual value in `shared/product.ts` is `500`. Tests pass silently if never run, but will fail when CI is added.
- **Fix:** Update assertions to `500` (or import from `shared/product.ts` and assert against the imported value).

### P0-06: Accent color mismatch — emerald vs blue
- **Files:** ~8 files, ~19 occurrences
  - `src/pages/Dashboard.tsx` (lines 114, 186)
  - `src/pages/Login.tsx`
  - `src/pages/Signup.tsx`
  - `src/pages/Pricing.tsx`
  - `src/features/dashboard/AccountSidebar.tsx`
  - `src/features/dashboard/OnboardingBanner.tsx`
  - `src/features/dashboard/DashboardListSection.tsx`
  - `src/features/dashboard/ComposeNotificationModal.tsx`
- **Problem:** `hover:bg-emerald-600` used for interactive elements. Design system accent is `#3B82F6` (blue). Emerald hover creates inconsistent branding.
- **Fix:** Replace all `hover:bg-emerald-600` with `hover:bg-blue-600` (or better: define `hover:bg-accent-hover` CSS variable and use that).

---

## P1 — Type Safety & Error Handling

### P1-01: AppIcon onError fallback not wired
- **File:** `src/components/AppIcon.tsx`
- **Problem:** `onError` fallback for broken icon images is commented out / not connected. Broken icon URLs show browser's broken image indicator.
- **Fix:** Wire `onError` handler on the `<img>` to set a fallback state that renders a default icon (first letter of app name in a colored circle).

### P1-02: Mark-as-read doesn't refresh paginated notification list
- **File:** `app/src/hooks/useNotifications.ts`
- **Problem:** After marking a notification as read, the paginated list still shows the old read state until manual refresh.
- **Fix:** After successful mark-as-read mutation, update the notification's `read` field in the local paginated cache (optimistic update) or trigger a refetch of the current page.

### P1-03: No error state in paginated notifications hook
- **File:** `app/src/hooks/useNotifications.ts`
- **Problem:** Paginated fetch has no error state — if the query fails, the UI shows empty list with no feedback.
- **Fix:** Add `error` state variable. Set it in the catch block. Return it from the hook. Display error banner in consuming component.

### P1-04: WEBHOOK_BASE hardcoded as production URL
- **File:** `src/features/dashboard/DashboardListSection.tsx:23`
- **Problem:** `WEBHOOK_BASE` is hardcoded to the production webhook URL. Other files derive it from environment variables. This breaks local/staging development.
- **Fix:** Use `import.meta.env.VITE_API_URL` or a shared constant. If it must differ from the API base, extract to an env var `VITE_WEBHOOK_BASE`.

### P1-05: Missing input validation on API endpoints
- **Files:** Multiple `api/*.ts` files
- **Problem:** Several endpoints trust client input without validation (e.g., `memberId`, `role` in `update-member.ts` accept any string without type narrowing).
- **Fix:** Add runtime validation at the top of each handler. For `update-member.ts`: verify `role` is `"viewer" | "editor"` explicitly. Consider a shared `assertString`/`assertEnum` helper.

### P1-06: Inconsistent error response shapes
- **Files:** `api/invite-member.ts`, `api/update-member.ts`, `api/accept-invite.ts`, `api/create-dashboard.ts`
- **Problem:** Some return `{ error: string }`, others `{ message: string }`, others `{ ok: false, error: string }`. Frontend has to handle all variants.
- **Fix:** Standardize on `{ ok: boolean, error?: string, data?: T }` across all endpoints. Create `api/_response.ts` with `jsonOk(data)` and `jsonError(status, message)` helpers.

---

## P2 — Duplication & Refactors

### P2-01: Split useDashboardPage.ts
- **File:** `src/features/dashboard/useDashboardPage.ts`
- **Problem:** Single 500+ line hook managing dashboards, members, compose, billing, devices, notifications, modals, and account deletion. Too many responsibilities; hard to maintain.
- **Fix:** Extract into focused hooks:
  - `useDashboards.ts` — CRUD dashboards, test webhook, copy token
  - `useMembers.ts` — fetch, invite, remove, update role
  - `useAccountActions.ts` — delete account, manage billing, sign out
  - `useNotificationQuota.ts` — usage tracking, quota display
  - Keep `useDashboardPage.ts` as a thin composer that calls each sub-hook and returns the merged interface.

### P2-02: Duplicate requireEnv function
- **Files:** 8 API files (each has its own inline `requireEnv`)
- **Problem:** Same 3-line function copy-pasted in `stripe-webhook.ts`, `create-dashboard.ts`, `invite-member.ts`, `accept-invite.ts`, `update-member.ts`, `delete-account.ts`, `manage-billing.ts`, `create-checkout.ts`.
- **Fix:** Create `api/_env.ts` exporting `requireEnv(name: string): string`. Import from `'./_env.js'` in all files. Delete inline copies.

### P2-03: Duplicate Supabase client creation
- **Files:** 7 API files
- **Problem:** Each file creates `createClient(url, serviceKey, { auth: { ... } })` with slightly different options. Some pass `persistSession: false`, others don't.
- **Fix:** Create `api/_supabase.ts` exporting `getServiceClient()` (service role, no session persistence) and optionally `getUserClient(token)` (user context). Import everywhere.

### P2-04: Duplicate getPasswordStrength
- **Files:** `src/pages/Signup.tsx`, `src/pages/ResetPassword.tsx`
- **Problem:** Identical password strength calculation function in two files.
- **Fix:** Extract to `src/lib/passwordStrength.ts`. Import in both pages.

### P2-05: Duplicate OAuth button markup
- **Files:** `src/pages/Login.tsx`, `src/pages/Signup.tsx`
- **Problem:** Google and GitHub OAuth buttons are identical JSX blocks (icon + label + click handler) duplicated across both auth pages.
- **Fix:** Create `src/components/OAuthButtons.tsx` with `<OAuthButtons onGoogleClick={...} onGitHubClick={...} />`. Use in both pages.

### P2-06: Push token fetch logic triplicated (mobile)
- **File:** `app/app/(tabs)/settings.tsx`
- **Problem:** Three identical blocks fetching the Expo push token with the same try/catch/permission logic.
- **Fix:** Extract to a single `async function getOrRegisterPushToken()` at module scope or in a shared hook. Call it from the three call sites.

### P2-07: LoadingSpinner extraction
- **Files:** Multiple — `Dashboard.tsx:76-83`, `Login.tsx`, `Signup.tsx`, `Pricing.tsx`, mobile `index.tsx`
- **Problem:** Identical loading spinner markup (`div` with `border-2 border-accent border-t-transparent rounded-full animate-spin`) repeated in 5+ places.
- **Fix:** Create `src/components/LoadingSpinner.tsx` with size prop. Replace all inline spinners. For mobile, create `app/src/components/LoadingSpinner.tsx`.

---

## P3 — Polish (Dead Code, Console Statements, Naming)

### P3-01: Console.log statements left in production code
- **Files:**
  - `src/features/dashboard/useDashboardPage.ts` — multiple `console.error` that should use a logger or be removed
  - `api/stripe-webhook.ts` — `console.log` for debugging webhook events
  - `app/app/(tabs)/settings.tsx` — `console.log` in push token flow
  - `app/src/hooks/useNotifications.ts` — `console.error` for fetch failures
- **Problem:** Console statements in production code. Not harmful but noisy and unprofessional.
- **Fix:** Remove debug `console.log` calls. Keep `console.error` for genuinely unexpected errors only. Consider a minimal logger wrapper if structured logging is needed.

### P3-02: Unused imports
- **Files:** Various (run `tsc --noUnusedLocals` or ESLint `no-unused-imports` to find all)
- **Problem:** Some files import types or components that are no longer used after refactors.
- **Fix:** Remove unused imports. Enable `noUnusedLocals` in `tsconfig.json` to prevent future drift.

### P3-03: Inconsistent file naming in api/
- **Files:** `api/` directory
- **Problem:** Mix of `kebab-case` (`update-member.ts`, `invite-member.ts`) and no clear pattern for shared helpers (`_auth.ts`, `_cors.ts`, `_email.ts` vs `_billing.ts`). Helpers use `_` prefix (good), but naming isn't alphabetically grouped by domain.
- **Fix:** No rename needed (Vercel routes depend on filenames), but document the convention: `_`-prefixed = shared helper (not a route), `kebab-case` = route handler.

### P3-04: Dead CSS / unused Tailwind classes
- **Problem:** Some components use custom classes or Tailwind utilities that may be dead after refactors.
- **Fix:** Run Tailwind's purge in production build (already configured). For custom CSS in `index.css`, audit manually and remove unused `@layer` rules.

### P3-05: Inconsistent modal close patterns
- **Files:** `AddDashboardModal`, `ComposeNotificationModal`, `MembersModal`, `DeleteAccountModal`
- **Problem:** Some modals close on backdrop click, others don't. Some clear state on close, others leave stale state.
- **Fix:** Standardize: all modals should close on backdrop click (with `e.target === e.currentTarget` guard), all should reset their local state in the `onClose` callback.

### P3-06: Magic numbers
- **Files:** Various
  - `useDashboardPage.ts` — `2000` (copy feedback ms), `3000` (test result clear ms)
  - `notify/index.ts` — `80`, `100` (quota percentages)
  - `settings.tsx` — `24`, `12` (hour formats)
- **Problem:** Raw numbers without explanation. Already partially addressed (COPY_FEEDBACK_MS, TEST_RESULT_CLEAR_MS extracted) but more remain.
- **Fix:** Extract remaining magic numbers to named constants at module scope with descriptive names.

### P3-07: Missing `key` props in mobile list renders
- **Files:** `app/app/(tabs)/index.tsx`, `app/app/(tabs)/settings.tsx`
- **Problem:** Some `FlatList` or `.map()` renders use index as key instead of a stable identifier.
- **Fix:** Use `item.id` as the key where available. Only fall back to index for truly static lists.

---

## Execution Order

**Phase 1 — Ship-blocking (P0):** Fix items P0-01 through P0-06. These are bugs or security issues that affect correctness in production. Estimated: 1-2 implementation loops.

**Phase 2 — Reliability (P1):** Fix P1-01 through P1-06. These improve error handling and developer experience. Estimated: 1-2 loops.

**Phase 3 — Maintainability (P2):** Extract duplicated code, split large files. P2-01 (useDashboardPage split) is the largest refactor — do it last within this phase after the smaller extractions (P2-02 through P2-07) reduce the file's surface area. Estimated: 2-3 loops.

**Phase 4 — Polish (P3):** Clean up console statements, unused imports, magic numbers. Low risk, do anytime. Estimated: 1 loop.

**Total: ~6-8 implementation loops for full cleanup.**
