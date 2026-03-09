# Hooks Audit (useApps & useNotifications)

## Files Reviewed
- `app/src/hooks/useApps.ts` — App CRUD mutations + queries
- `app/src/hooks/useNotifications.ts` — Notification queries + mark-as-read mutations
- `app/app/edit-app.tsx` — Consumer of useCreateApp, useUpdateApp, useDeleteApp
- `app/app/(tabs)/index.tsx` — Consumer of useApps, useDeleteApp
- `app/app/(tabs)/notifications.tsx` — Consumer of notification hooks

## Bugs Fixed

### 1. useDeleteApp didn't clean up individual app cache entry
**File:** `app/src/hooks/useApps.ts`
- **Before:** `onSuccess` only called `invalidateQueries({ queryKey: APPS_KEY })` — the list query. The individual `["apps", id]` cache entry for the deleted app was never removed. If any component later accessed `useApp(id)`, it would get stale cached data showing the deleted app as still existing until the query refetched and hit a Supabase error.
- **Fix:** Added `queryClient.removeQueries({ queryKey: ["apps", id] })` in `onSuccess`. Used `removeQueries` (not `invalidateQueries`) because the data no longer exists — there's nothing valid to refetch.

### 2. handleDelete in edit-app.tsx had no error handling
**File:** `app/app/edit-app.tsx`
- **Before:** `await deleteApp.mutateAsync(params.id!)` with no try/catch. If the Supabase delete failed (network error, RLS rejection, constraint violation), the promise rejected unhandled. `router.back()` never executed, and the user got no feedback about the failure.
- **Fix:** Wrapped in try/catch with `Alert.alert("Error", ...)` matching the same pattern used by `handleSave`.

## Verified Correct (No Changes Needed)

### useCreateApp
- `onSuccess` invalidates `APPS_KEY` — new app appears in list.
- No individual cache to invalidate (app didn't exist before).
- Caller (`edit-app.tsx handleSave`) uses `mutateAsync` with try/catch and Alert on error.

### useUpdateApp
- `onSuccess` invalidates both `APPS_KEY` (list) and `["apps", data.id]` (detail) — both views refresh.
- Caller uses `mutateAsync` with try/catch. Correct.

### useUpdateLastOpened
- `onSuccess` invalidates `APPS_KEY` — sort order updates (apps sorted by `last_opened_at`).
- Called from WebView screen (`[id].tsx`) with `useRef` guard preventing duplicate calls.

### useApps / useApp
- Both use `enabled: !!user` — won't fire when signed out.
- `useApp` additionally requires `!!id`.
- Both throw on Supabase error — React Query surfaces it via `error` state.

### useNotifications
- `refetchOnMount: "always"` and `staleTime: 5_000` — always refetches when tab is focused, but won't refetch within 5s (prevents rapid-fire requests on fast tab switches).
- Limit of 100 notifications — reasonable query bound.

### useUnreadCount
- Same `refetchOnMount`/`staleTime` strategy.
- Uses `count: "exact", head: true` — efficient server-side count without transferring rows.
- Query key `["notifications", "unread_count"]` is a child of `NOTIFICATIONS_KEY` — invalidating `NOTIFICATIONS_KEY` also invalidates this (prefix match).

### useMarkAsRead / useMarkAllAsRead
- Both invalidate `NOTIFICATIONS_KEY` which cascades to all notification queries (list, unread count, monthly count).
- `useMarkAllAsRead` has `if (!user) throw new Error("Not authenticated")` guard.
- Callers: notification tap handler uses `markAsRead.mutate()` (fire-and-forget, appropriate since user is navigating away). Mark-all button uses `disabled={markAllAsRead.isPending}` to prevent double-tap.
- Monthly count is unnecessarily invalidated (mark-as-read doesn't change `created_at`), but the overhead is one extra `head: true` count query — negligible.

### useMonthlyNotificationCount
- Computes start-of-month correctly: `new Date(year, month, 1)`.
- `staleTime: 30_000` — reasonable for a count that changes infrequently.

### useLatestNotificationByApp
- Derives from `useNotifications()` data — no separate query.
- React Query deduplicates the underlying notifications fetch across all consumers.
- Rebuilds Map on each render per consumer (called per AppCard), but with ≤100 notifications this is negligible.
- Notifications are already sorted by `created_at desc`, so the first entry per `app_id` is always the latest. Correct.

### Webhook token generation
- `expo-crypto getRandomBytes(32)` — cryptographically secure.
- 64 hex characters of entropy — sufficient for webhook authentication.
