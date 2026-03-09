# Notifications Tab Audit & Fixes

**File:** `app/app/(tabs)/notifications.tsx`

## Bug Fixed

### Pull-to-refresh spinner never showed
- **Before:** `refreshing={false}` hardcoded — native spinner disappeared immediately on pull.
- **Fix:** Changed to `refreshing={isFetching}` using react-query's `isFetching` flag.

## Verified Correct (No Changes Needed)

### 1. Mark-as-read on tap
- `handlePress` calls `markAsRead.mutate(notification.id)` when `isUnread` is true.
- Then navigates to `/app/[id]` (the app's WebView).
- `useMarkAsRead` updates `read_at` to current timestamp, then invalidates `NOTIFICATIONS_KEY`.
- Invalidation cascades to `useUnreadCount` (key `["notifications", "unread_count"]`) since it's a prefix match — badge updates automatically.

### 2. Mark-all-read button
- Positioned at top-right of header via `justifyContent: "space-between"`.
- Only rendered when `(unreadCount ?? 0) > 0` — hidden during loading and when all read.
- `disabled={markAllAsRead.isPending}` prevents double-taps.
- `useMarkAllAsRead` updates all user's notifications where `read_at IS NULL`, then invalidates `NOTIFICATIONS_KEY` — both the list and unread count refresh.

### 3. Empty state
- `ListEmptyComponent` renders `EmptyState` with bell icon, "No notifications yet", and helpful subtitle.
- `listEmpty` style sets `flex: 1` for proper centering.

### 4. Unread badge count
- Tab bar badge in `_layout.tsx` line 94: `badge={unreadCount}` from `useUnreadCount()`.
- `useUnreadCount` does `select("*", { count: "exact", head: true })` with `.is("read_at", null)` — accurate server-side count.
- Badge renders with `colors.danger` background, shows "99+" for counts over 99.
- Both `markAsRead` and `markAllAsRead` invalidate the unread count query, so the badge updates in real-time after any read action.

### 5. Free user limit (added in prior task)
- Free users see first 20 notifications, with compact `UpgradePrompt` footer when more exist.
- Pro users see all (up to 100, the query limit).
