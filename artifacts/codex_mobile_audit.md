**Scope checked**
- Audited only `app/app/**`, `app/src/**`, `app/package.json`, and `app/tsconfig.json`.
- Excluded `src/**`, `api/**`, `backend/**`, `Relay/**`, and package manifests outside `app/`.

**Architecture observations**
- `expo-router` drives a root stack plus a tab shell; auth restore, native deep-link session parsing, React Query setup, push registration, and notification handling are all mounted from `app/app/_layout.tsx:24`.
- Server state is fetched directly from Supabase through React Query hooks in `app/src/hooks/useApps.ts:9`, `app/src/hooks/useNotifications.ts:8`, and `app/src/hooks/useProfile.ts:8`.
- Short-lived client state is intentionally small and split across Zustand stores for auth, navigation handoff, and theme settings in `app/src/stores/authStore.ts:12`, `app/src/stores/navigationStore.ts:9`, and `app/src/stores/settingsStore.ts:30`.
- Notification navigation is a two-step flow: global listener writes pending route state, then the tab layout consumes it and pushes into `/app/[id]` via `app/src/hooks/useNotificationHandler.ts:24` and `app/app/(tabs)/_layout.tsx:49`.
- Web behavior is deliberately different from native: dashboards open in a browser tab instead of an embedded view in `app/app/(tabs)/index.tsx:38` and `app/app/app/[id].tsx:37`.

**Strengths**
- Separation of concerns is generally clean: routes in `app/app/**`, data hooks in `app/src/hooks/**`, stores in `app/src/stores/**`, and theme primitives in `app/src/theme/**`.
- Auth gating is simple and consistent at route boundaries in `app/app/index.tsx:7`, `app/app/(tabs)/_layout.tsx:61`, and `app/app/app/[id].tsx:26`.
- Theme handling is centralized and persisted cleanly in `app/src/theme/tokens.ts:1`, `app/src/theme/useTheme.ts:5`, and `app/src/stores/settingsStore.ts:30`.
- URL validation is more careful than typical mobile forms, especially around private/local addresses, in `app/src/utils/url.ts:30`.
- Utility coverage exists for time and URL parsing in `app/src/__tests__/time.test.ts:3` and `app/src/__tests__/url.test.ts:3`.

**Findings by severity**
**Critical**
- React Query cache is not scoped to the authenticated user and is not cleared on auth transitions, so a sign-out/sign-in to a different account in the same app process can briefly render the previous user’s apps, notifications, and profile from cache before refetch completes. The cache keys are global in `app/src/hooks/useApps.ts:7`, `app/src/hooks/useNotifications.ts:6`, and `app/src/hooks/useProfile.ts:6`, while the shared client survives auth changes in `app/app/_layout.tsx:15` and auth changes only call `setSession` in `app/app/_layout.tsx:41`.

**High**
- The upgrade/auth handoff sends both `access_token` and `refresh_token` to `relayapp.dev` in URL query params, even though the comment says the handoff uses the URL hash. Query params are much easier to leak into browser history, analytics, logs, and intermediary services. See `app/src/components/UpgradePrompt.tsx:91`, `app/src/components/UpgradePrompt.tsx:101`, and `app/src/components/UpgradePrompt.tsx:107`.
- Push registration is effectively bound to the first logged-in user for the life of the app process. `registered.current` blocks re-registration after first success, and sign-out only calls Supabase auth sign-out without removing or rebinding the device token. On shared devices, the previous account can remain associated with the push token and the next account may never register until restart. See `app/src/hooks/usePushRegistration.ts:15`, `app/src/hooks/usePushRegistration.ts:18`, `app/src/hooks/usePushRegistration.ts:62`, `app/src/hooks/usePushRegistration.ts:78`, and `app/app/(tabs)/settings.tsx:96`.

**Medium**
- Notification state is not refreshed when a push is received. The notification handler routes on tap, but it does not invalidate or update the notifications/unread queries, so the badge and list can remain stale until manual refresh or remount. See `app/src/hooks/useNotificationHandler.ts:32`, `app/src/hooks/useNotifications.ts:12`, and `app/app/(tabs)/_layout.tsx:46`.
- Plan gating silently falls back to `"free"` when the profile is still loading or when the profile query errors, which can incorrectly show upgrade prompts or block paid users from adding dashboards. See `app/app/(tabs)/index.tsx:120`, `app/app/(tabs)/settings.tsx:79`, and `app/src/hooks/useProfile.ts:11`.
- The edit screen has no not-found/error state for invalid or unauthorized app IDs. It only gates on `loadingApp`, so a failed `useApp` lookup falls through to an empty edit form with save/delete affordances instead of a clear error. See `app/app/edit-app.tsx:43`, `app/app/edit-app.tsx:127`, and `app/src/hooks/useApps.ts:32`.

**Low**
- Pull-to-refresh never shows an active refreshing state because both major lists hard-code `refreshing={false}`, which makes the interaction feel broken and allows repeated refetch taps without visible feedback. See `app/app/(tabs)/index.tsx:252` and `app/app/(tabs)/notifications.tsx:156`.
- The Settings notification status is read once on mount and not refreshed after the user returns from OS settings, so the displayed value can be stale. See `app/app/(tabs)/settings.tsx:84` and `app/app/(tabs)/settings.tsx:109`.
- `app/app/auth.tsx` still contains a hard-coded `SUPABASE_URL` constant that is unused and out of step with the env-driven client setup, which is minor drift risk and dead config. See `app/app/auth.tsx:21` and `app/src/lib/supabase.ts:24`.

**Test and DX notes**
- The app has basic developer scripts for linting, formatting, type-checking, and tests in `app/package.json:5`, and TypeScript strict mode is enabled in `app/tsconfig.json:4`.
- In-scope automated tests only cover utility behavior in `app/src/__tests__/time.test.ts:1` and `app/src/__tests__/url.test.ts:1`.
- There is no in-scope test coverage for auth transitions, query-cache isolation across users, push registration lifecycle, notification tap routing, or plan-gating behavior.
- This was a static read-only audit; no runtime verification was performed.

**Recommended next actions**
- Scope React Query keys by `user.id` and clear/reset the query cache on sign-out and account switch.
- Replace the query-param token handoff with a server-mediated exchange or another mechanism that never exposes refresh tokens in URL search params.
- Rework push-token lifecycle to support shared-device auth changes: delete or detach old device rows on sign-out, reset registration state on user change, and re-register for the active user.
- Invalidate notification queries when pushes arrive or when the app returns to foreground, so badge/list state stays in sync.
- Add focused integration tests for account switching, notification tap routing, paid-plan gating, and invalid `edit-app` IDs.
