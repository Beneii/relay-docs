# Loop 9 Plan: Mobile Notification History

## Current State

The mobile app already has a Notifications tab (`app/app/(tabs)/notifications.tsx`) with:
- FlatList of notifications with pull-to-refresh
- Unread dot + mark-as-read on tap
- "Mark all read" button
- App name display per notification
- Free plan limited to 20 visible items with upgrade prompt
- Query: `useNotifications()` fetches `.limit(100)` with no pagination, no filters

**Key gap:** The `NotificationRow` type (`app/src/types/database.ts`) is missing `severity`, `channel`, `actions_json`, `pushed_count`, and `deep_link_url` fields added in migrations 00011-00015. The notification cards show only title, body, app name, and timestamp — no severity, no channel, no metadata, no expand/collapse.

## Plan

### File 1: `app/src/types/database.ts` — Update NotificationRow

Add missing columns to the `notifications.Row` type:
```ts
severity: "info" | "warning" | "critical" | null;
channel: string | null;
actions_json: Array<{ label: string; url: string; style?: string }> | null;
pushed_count: number | null;
deep_link_url: string | null;
request_signature: string | null;
```

### File 2: `app/src/hooks/useNotifications.ts` — Add pagination + filters

**Replace `useNotifications` with `useInfiniteNotifications`:**
- Use `useInfiniteQuery` from `@tanstack/react-query`
- Page size: 25
- Cursor-based pagination via `created_at` of last item
- Accept filter params: `severity`, `channel`, `appId` (all optional)
- Query builds `.eq()` filters dynamically based on active filters
- `getNextPageParam` returns the `created_at` of the last item, or undefined if fewer than 25 returned

**Keep `useNotifications` as a simple wrapper** that flattens pages for backward compatibility (used by `useLatestNotificationByApp`).

**Add `useDistinctChannels` hook:**
- Query distinct channels from notifications (client-side from loaded data, or a separate small query)
- Used to populate the channel filter dropdown

### File 3: `app/app/(tabs)/notifications.tsx` — Enhanced notification list

**Header changes:**
- Add filter bar below the title: horizontal `ScrollView` with pill-style filter chips
  - Severity filter: "All" | "Info" | "Warning" | "Critical" (toggle, single-select)
  - Channel filter: pills for each distinct channel (from `useDistinctChannels`)
  - App filter: pills for each app (from `useApps`)
- Active filter has `bg-accent text-white`, inactive has `bg-surface border-border`
- "Mark all read" moves to a small icon button to save space

**NotificationItem changes:**
- Add severity badge: colored pill left of title
  - info: `colors.accent` bg, white text
  - warning: `colors.warning` bg
  - critical: `colors.danger` bg
- Add channel tag: small monospace pill below body (if channel is set)
- Add expand/collapse on tap (instead of navigating immediately):
  - Collapsed (default): title (1 line), body (2 lines), app name, timestamp — same as now
  - Expanded: full body text, metadata_json rendered as key-value pairs, action buttons, deep link URL, pushed_count, "Open app" button that navigates to `/app/[id]`
  - Tap toggles expand state; long-press navigates to app
- Track expanded item IDs in component state (`Set<string>`)

**Infinite scroll:**
- `onEndReached` calls `fetchNextPage()`
- `onEndReachedThreshold={0.5}`
- Footer shows loading spinner when `isFetchingNextPage`
- Footer shows "No more notifications" when all pages loaded

**Free plan gate stays the same:** show upgrade prompt after 20 items.

### File 4: `app/src/components/SeverityBadge.tsx` — New shared component

Small reusable component:
```tsx
interface SeverityBadgeProps {
  severity: "info" | "warning" | "critical" | null;
}
```
Returns a colored pill with the severity text. Used in notifications list and potentially elsewhere.

Colors:
- `info` → `colors.accent` background, white text
- `warning` → `colors.warning` background, dark text
- `critical` → `colors.danger` background, white text
- `null` → don't render

### File 5: `app/src/components/ChannelTag.tsx` — New shared component

Monospace pill showing channel name. Light border, small font.

---

## Data flow

```
useInfiniteNotifications(filters)
  ├── page 1: .select("*").order("created_at", desc).limit(25)
  ├── page 2: .lt("created_at", lastCursor).limit(25)
  └── filters: .eq("severity", x), .eq("channel", y), .eq("app_id", z)

NotificationsScreen
  ├── Filter bar (severity, channel, app pills)
  ├── FlatList with infinite scroll
  │   ├── NotificationItem (collapsed)
  │   │   ├── SeverityBadge
  │   │   ├── title + timestamp
  │   │   ├── body (2 lines)
  │   │   └── app name + ChannelTag
  │   └── NotificationItem (expanded)
  │       ├── everything above +
  │       ├── full body text
  │       ├── metadata key-value pairs
  │       ├── action buttons
  │       └── "Open app" button
  └── Footer (loading / end-of-list / upgrade prompt)
```

## Edge cases

- **Empty filter results:** Show `EmptyState` with "No notifications match your filters" and a "Clear filters" button
- **Metadata rendering:** Handle nested objects by JSON-stringifying values deeper than 1 level; cap at 10 keys displayed with "show more"
- **Actions display:** Render action labels as tappable buttons that open the action URL via `Linking.openURL()`
- **Mixed pagination + filters:** Changing a filter resets the infinite query (new queryKey includes filter values)
- **Offline:** React Query's cache shows last-fetched data; pull-to-refresh shows error toast if offline

## Files summary

| File | Action | What |
|------|--------|------|
| `app/src/types/database.ts` | Modify | Add missing notification columns |
| `app/src/hooks/useNotifications.ts` | Modify | Add `useInfiniteNotifications`, filters, `useDistinctChannels` |
| `app/app/(tabs)/notifications.tsx` | Modify | Filter bar, severity/channel badges, expand/collapse, infinite scroll |
| `app/src/components/SeverityBadge.tsx` | Create | Reusable severity pill |
| `app/src/components/ChannelTag.tsx` | Create | Reusable channel pill |
