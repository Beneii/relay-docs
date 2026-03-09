# Home Tab (Dashboards) Audit & Fixes

**File:** `app/app/(tabs)/index.tsx`

## Bugs Fixed

### 1. Pull-to-refresh spinner never showed
- **Before:** `refreshing={false}` hardcoded — the native pull-to-refresh indicator disappeared immediately, giving no visual feedback during refetch.
- **Fix:** Changed to `refreshing={isFetching}` using react-query's `isFetching` flag, which is `true` during both initial loads and background refetches.

### 2. "dashboard" not pluralized in plan badge
- **Before:** `{appCount}/{FREE_LIMITS.dashboards} dashboard` — showed "0/3 dashboard", "2/3 dashboard".
- **Fix:** Changed to `dashboards` (always plural, since the limit is 3).

## Verified Correct (No Changes Needed)

### Empty state
- `ListEmptyComponent` renders `EmptyState` with layers icon, "No dashboards yet" title, and helpful subtitle.
- `listEmpty` style sets `flex: 1` so it centers properly.

### Long-press menu
- `Alert.alert` with three options: Edit, Delete (destructive), Cancel.
- Delete triggers a second confirmation alert: "Are you sure you want to delete [name]?"
- Delete calls `deleteApp.mutate(app.id)` on confirmation.
- Edit navigates to `/edit-app?id=...`.

### App count vs limit (free vs pro)
- Free users: plan badge shows `{count}/3 dashboards` in a pill below the brand header.
- Pro users: no plan badge shown (correct — no limit to display).
- `atLimit` flag (`plan === "free" && appCount >= FREE_LIMITS.dashboards`) controls:
  - Add button shows lock icon + "Limit" text with muted styling
  - Tapping it shows upgrade alert instead of navigating to edit-app
  - `UpgradePrompt` compact banner shown as `ListHeaderComponent`

### App cards
- Shows `AppIcon` (48px), name, hostname, and latest notification with accent dot + timeAgo.
- Tap opens WebView (`/app/[id]`), or `window.open` on web.
- `android_ripple` for Material feedback.
- Chevron-right indicator on the right edge.
