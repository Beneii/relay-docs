# Edit App Screen Audit & Fixes

**File:** `app/app/edit-app.tsx`

## Issues Found & Fixed

### 1. No webhook hint in create mode
- **Before:** Webhook section only shown in edit mode (`isEditing && existingApp`). In create mode, no indication that a webhook URL would be generated.
- **Fix:** Added a dashed-border hint box in create mode: link icon + "A unique webhook URL will be generated when you save."
- **Why:** Users creating their first app need to know the webhook URL comes after saving, not before.

### 2. Icon picker always showed emerald
- **Before:** `AppIcon` in the picker used `accentColor={null}`, defaulting all icons to emerald (`#10B981`) regardless of the user's selected color.
- **Fix:** The selected icon now renders with the user's chosen accent color (`accentColor={icon === key ? accentColor : null}`). Unselected icons stay neutral.
- **Why:** The selected icon in the picker should match the preview at the top of the screen for visual consistency.

## Already Correct (No Changes Needed)

### Icon picker
- 12 icons from `ICON_KEYS` in a flex-wrap grid
- Selected icon: `accentSubtle` background + `accent` border
- Unselected: `surface` background + `border` border
- Large 64px preview at top reflects current icon + color

### Color picker
- 8 accent colors in a horizontal row
- Selected: `textPrimary` border (2.5px), Unselected: transparent border
- 32x32 circles with `radii.full` — clean and tappable

### Webhook URL (edit mode)
- Shows truncated token with copy button
- `handleCopyWebhook` builds full URL from Supabase config + webhook_token
- Copies to clipboard via `expo-clipboard` and shows Alert confirmation

### Notifications toggle
- Custom toggle with knob animation (translateX: 2 vs 18)
- Accent background when enabled, `textTertiary` when disabled

### Form validation
- Name: must be non-empty (`name.trim().length > 0`)
- URL: validated via `validateUrl()`, shows warning/error below input with colored border
- Save button disabled (grayed) when form invalid or saving in progress
