# Lib & Stores Audit

## Files Reviewed
- `app/src/lib/supabase.ts` — Supabase client setup
- `app/src/stores/authStore.ts` — Auth state (zustand)
- `app/src/stores/navigationStore.ts` — Push notification deep link state
- `app/src/stores/settingsStore.ts` — Theme preferences
- `app/app/_layout.tsx` — Root layout (QueryClient, auth listener, deep links)
- `app/src/hooks/usePushRegistration.ts` — Push token registration/deregistration
- `app/src/hooks/useNotificationHandler.ts` — Notification tap handling
- `app/src/hooks/useApps.ts` — App CRUD hooks
- `app/src/hooks/useNotifications.ts` — Notification query hooks
- `app/src/hooks/useProfile.ts` — Profile query + plan limits

## Bugs Fixed

### 1. App hangs forever if session restore fails (`_layout.tsx`)
- **Before:** `supabase.auth.getSession().then(...)` had no `.catch()`. If `getSession()` rejected (corrupt storage, etc.), `setInitialized(true)` never ran — app stuck on `<LoadingScreen />` permanently.
- **Fix:** Added `.catch(() => setInitialized(true))` so the app progresses to the auth screen even if session restore fails.

### 2. Deep link auth silently swallowed errors (`_layout.tsx`)
- **Before:** `supabase.auth.setSession(...)` in `extractSessionFromUrl` was fire-and-forget. A malformed or expired callback token would fail silently with an unhandled promise rejection.
- **Fix:** Added `.catch()` with `console.error` so failures are logged for debugging.

### 3. Dead device deregister code in `usePushRegistration.ts`
- **Before:** On sign-out, the hook tried `supabase.from("devices").delete()` to remove the device row. But by this point `supabase.auth.signOut()` had already cleared the client's auth session, so RLS rejected the delete every time. The error was caught and logged, but the delete never succeeded.
- **Why it was dead:** The `onAuthStateChange` listener in `_layout.tsx` calls `setSession(null)`, which triggers the zustand user→null change, which triggers this effect. But `signOut()` already cleared the auth header, so the client has no credentials for the RLS-protected delete.
- **Fix:** Removed the broken `supabase.from().delete()` call. The actual working device deregistration happens in `settings.tsx handleSignOut`, which deletes the device row BEFORE calling `signOut()` while the session is still active. The hook now only resets its local refs (`registered`, `lastToken`, `lastUserId`).

## Verified Correct (No Changes Needed)

### supabase.ts — Client Setup
- SecureStore chunking handles JWTs exceeding the 2048-byte limit correctly.
- `resolveEnv` properly filters placeholder values from app.json.
- `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: web-only` — all correct.

### authStore.ts
- Minimal zustand store: `session`, `user` (derived from session), `initialized`.
- `setSession` correctly derives `user` from `session?.user ?? null`.

### navigationStore.ts
- Simple `pendingAppId` for cold-start push notification routing. Correct.

### settingsStore.ts
- Theme preference persisted to SecureStore (native) / localStorage (web).
- `loadSettings` validates stored value before applying. `setThemeMode` persists asynchronously with error catch.

### _layout.tsx — Auth Listener
- `onAuthStateChange` calls `setSession()` and `queryClient.clear()` on sign-out — prevents data leaking between accounts.
- `queryClient` is module-scoped singleton — correct.
- Settings load blocks rendering until complete — prevents flash of wrong theme.

### Query Hooks (useApps, useNotifications, useProfile)
- All use `enabled: !!user` — won't fire when signed out.
- All mutations invalidate relevant query keys on success.
- `useUnreadCount` uses `["notifications", "unread_count"]` which is a prefix match with `NOTIFICATIONS_KEY` — badge updates when notifications are marked read.
- `useLatestNotificationByApp` derives from `useNotifications` data — no separate query, automatically stays in sync.

### usePushRegistration — Registration Path
- Guards: `!user`, `!session?.access_token`, `registered.current`, `Platform.OS === "web"`, `!Device.isDevice`, permission denied, missing EAS project ID — all correctly handled.
- `registered` ref prevents duplicate registrations across re-renders.
- Captures `accessToken` at registration time (fresh from sign-in, won't be stale).

### useNotificationHandler
- Foreground notification display configured via `setNotificationHandler`.
- Tap handler routes to `/app/[id]` using `appId` from notification data.
- Cold start handled via `getLastNotificationResponseAsync` → `setPendingAppId`.

## Architecture Notes

### Sign-out flow (complete path)
1. User taps "Sign Out" in settings
2. `handleSignOut` deletes device row from `devices` table (session still active, RLS passes)
3. `supabase.auth.signOut()` clears local session
4. `onAuthStateChange` fires with `session = null`
5. `setSession(null)` → zustand `user` becomes null → all `enabled: !!user` queries stop
6. `queryClient.clear()` wipes all cached data (prevents cross-account leak)
7. `usePushRegistration` effect resets refs (registration state cleared)
8. App redirects to auth screen

### Token refresh
- `autoRefreshToken: true` handles JWT expiry automatically.
- Token refresh fires `TOKEN_REFRESHED` event via `onAuthStateChange`, which calls `setSession(newSession)` — queries continue working with fresh token.
- No `queryClient.clear()` on refresh (correct — cache should persist).
