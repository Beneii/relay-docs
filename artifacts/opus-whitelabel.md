# White-Label Plan: Custom App Branding in Relay

## What exists today

- **AppIcon component** renders a Feather icon in a colored rounded square. The icon is one of 12 preset keys (globe, server, chart, etc.), and the accent color is stored as `accent_color` hex on the apps row.
- **relay.json manifest** already defines `icon` (URL or path), `theme_color`, `background_color`, and `name` — but only `name`, `theme_color`, and `notifications` are consumed. The `icon` URL field is ignored.
- **edit-app.tsx** lets users pick from 12 Feather icons and 8 preset accent colors. No custom image upload, no custom hex input.
- **app/[id].tsx** (webview) has no branding — plain webview with no header showing the app name/color.
- **DB schema** has `icon` (string key) and `accent_color` (hex) on the `apps` table. No field for a custom icon URL/image.

## Plan

### 1. DB Migration: `00019_app_branding.sql`

```sql
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS custom_icon_url TEXT,      -- https URL or data URI
  ADD COLUMN IF NOT EXISTS custom_app_name TEXT,      -- display name override
  ADD COLUMN IF NOT EXISTS background_color TEXT;     -- hex for tile bg
```

- `custom_icon_url`: remote image URL (from relay.json `icon` field or user upload). When set, takes precedence over the Feather icon key in `icon`.
- `custom_app_name`: optional display name override (shows in app list instead of `name`). Useful when `name` is the technical dashboard name but the user wants a branded label.
- `background_color`: tile background color (from relay.json `background_color`). Distinct from `accent_color` which colors the icon and UI accents.

### 2. Update `app/src/types/database.ts`

Add to `apps.Row`:
```ts
custom_icon_url: string | null;
custom_app_name: string | null;
background_color: string | null;
```

Add to `apps.Insert` and `apps.Update` accordingly.

### 3. Update relay.json consumption in `app/app/edit-app.tsx`

Currently the manifest auto-fetch (lines 56-100) ignores `icon`, `background_color`, `description`, and `tabs`. Change to:

```ts
// After fetching relay.json:
if (manifest.icon) setCustomIconUrl(manifest.icon);       // new state
if (manifest.background_color) setBackgroundColor(manifest.background_color);  // new state
if (manifest.theme_color) setAccentColor(manifest.theme_color);  // already done
if (manifest.name && !name) setName(manifest.name);              // already done
```

**New form sections in edit-app.tsx:**

**Custom icon section** (between Icon Grid and Color Swatches):
- Show current `customIconUrl` preview (Image component, 64px rounded square)
- "Use custom icon" text input for URL (placeholder: `https://example.com/icon.png`)
- "Or choose a built-in icon above"
- When `customIconUrl` is set, the Feather icon grid selections are dimmed/disabled
- Clear button to revert to Feather icon
- Pro gate: if `profile.plan !== 'pro'`, show lock icon + "Pro feature" label, input disabled

**Background color** (below accent color swatches):
- Same swatch grid pattern, or hex text input
- Label: "Tile background" with preview

**Custom display name** (below Name input):
- Optional text input: "Display name (shown in app list)"
- Placeholder: uses `name` value
- Pro gate same as icon

**Save payload** adds: `custom_icon_url`, `custom_app_name`, `background_color`

### 4. Update `app/src/components/AppIcon.tsx`

Add `customIconUrl` prop:

```tsx
interface AppIconProps {
  icon: string | null;
  accentColor: string | null;
  customIconUrl?: string | null;
  backgroundColor?: string | null;
  size?: number;
}
```

Rendering logic:
- If `customIconUrl` is set: render `<Image source={{ uri: customIconUrl }}` inside the rounded square, with `backgroundColor` (or fallback to `accentColor + "20"`)
- If `customIconUrl` is not set: render Feather icon as before

### 5. Update home tab `app/app/(tabs)/index.tsx`

**AppCard changes:**
- Pass `app.custom_icon_url` and `app.background_color` to `AppIcon`
- Display `app.custom_app_name || app.name` as the card title
- If `custom_icon_url` is set, the tile should feel "branded" — the background color fills the icon square instead of the faint accent tint

### 6. Update webview `app/app/app/[id].tsx`

**Add a branded header bar** at the top of the webview when the app has custom branding:

```tsx
{(app.custom_icon_url || app.accent_color) && (
  <View style={[styles.brandedHeader, { backgroundColor: app.accent_color || colors.surface }]}>
    <AppIcon
      icon={app.icon}
      accentColor={app.accent_color}
      customIconUrl={app.custom_icon_url}
      size={28}
    />
    <Text style={styles.brandedHeaderTitle}>
      {app.custom_app_name || app.name}
    </Text>
  </View>
)}
```

- Header height: 44pt, sits below SafeAreaView top edge
- Shows custom icon (28px) + app name
- Background uses `accent_color` with white text, or surface with primary text
- This replaces the current bare webview — gives every app a branded identity bar

### 7. Update `backend/shared/product.ts` — Pro gate

Add to limits:

```ts
export const FREE_LIMITS = {
  dashboards: 3,
  devices: 1,
  notificationsPerMonth: 500,
  customBranding: false,        // new
} as const;

export const PRO_LIMITS = {
  dashboards: Number.POSITIVE_INFINITY,
  devices: 10,
  notificationsPerMonth: 10_000,
  customBranding: true,         // new
} as const;
```

Free users:
- Can use the 12 built-in Feather icons and 8 preset accent colors (as today)
- Cannot set `custom_icon_url`, `custom_app_name`, or `background_color`
- These fields show a Pro badge + upgrade prompt in edit-app

Pro users:
- Full custom icon URL, display name, accent + background colors
- relay.json fields are fully consumed

### 8. Update relay.json manifest schema in SDK

`packages/sdk/src/manifest.ts` — the `icon` field is already defined. Ensure validation accepts:
- Relative paths (`/icon.png`) — resolved against app URL
- Absolute https URLs
- Data URIs (`data:image/png;base64,...`)
- Max size validation note in docs (recommend 512x512 PNG, < 200KB)

### 9. Update web dashboard `src/features/dashboard/types.ts`

Add `custom_icon_url`, `custom_app_name`, `background_color` to the `Dashboard` interface so the web dashboard can display them too. The web `DashboardCard` can show custom icons as `<img>` elements.

### 10. Docs update

Add a "Custom Branding" section to `/docs` covering:
- relay.json fields: `icon`, `theme_color`, `background_color`, `name`
- How they appear in the mobile app
- Pro requirement for custom icon URL and display name
- Recommended icon specs (512x512 PNG, transparent background)

---

## Files summary

| File | Action |
|------|--------|
| `backend/supabase/migrations/00019_app_branding.sql` | Create — add columns |
| `backend/shared/product.ts` | Modify — add `customBranding` to limits |
| `app/src/types/database.ts` | Modify — add columns to Row/Insert/Update |
| `app/src/components/AppIcon.tsx` | Modify — support `customIconUrl`, `backgroundColor` |
| `app/app/edit-app.tsx` | Modify — custom icon URL input, display name input, bg color, Pro gate, consume full manifest |
| `app/app/app/[id].tsx` | Modify — add branded header bar |
| `app/app/(tabs)/index.tsx` | Modify — pass custom fields to AppIcon, use display name |
| `src/features/dashboard/types.ts` | Modify — add new fields to Dashboard type |
| `packages/sdk/src/manifest.ts` | Verify — icon field validation |

## Pricing

Custom branding is a Pro feature. It's a natural fit because:
- Free users get functional push notifications with built-in icons — perfectly adequate
- Pro users who pay $7.99/mo are building real products/tools and want their brand visible
- Custom branding is visible to the user every time they open the app — high perceived value, low engineering cost
- It's a gentle upsell: free users see the Pro badge on the branding fields every time they edit an app
