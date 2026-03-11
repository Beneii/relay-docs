# P2 Wave 2 Fixes

## 1. LoadingSpinner component

### Created: `src/components/LoadingSpinner.tsx`
- Sizes: `xs` (3.5), `sm` (4), `md` (5, default), `lg` (10)
- Style: `border-2 border-accent border-t-transparent rounded-full animate-spin`
- Accepts optional `className` for positioning (e.g. `mx-auto mb-4`)

### Replaced inline spinners in 6 files:
| File | Line | Size | Notes |
|------|------|------|-------|
| `src/main.tsx:22` | RouteLoader | md | Suspense fallback |
| `src/pages/Dashboard.tsx:79` | Loading state | md | "Loading your dashboards..." |
| `src/pages/Dashboard.tsx:90` | Provisioning state | lg | With `mx-auto mb-4` |
| `src/pages/Pricing.tsx:90` | Loading state | md | "Loading..." |
| `src/pages/InviteAccept.tsx:81` | Accepting state | md | "Accepting invite..." |
| `src/pages/ResetPassword.tsx:131` | Verifying state | lg | With `mx-auto mb-4` |

### Not replaced (intentionally different colors):
- Login.tsx / Signup.tsx OAuth buttons — use `border-text-muted` (muted color in white button context)
- MembersModal.tsx — uses `border-white` and `border-current`
- DashboardListSection.tsx — uses `border-current` (inherits parent text color)
- ComposeNotificationModal.tsx / modals.tsx — uses `border-white/30 border-t-white`
- OutboundWebhooksSection.tsx — uses `border-current` and `border-white`

These use contextual colors that differ from the accent spinner. A future pass could add a `color` prop to handle them.

## 2. Push token dedup in `app/app/(tabs)/settings.tsx`

### Created: `getExpoPushToken()` helper
Module-level async function that:
1. Returns `null` on web platform
2. Checks `Constants.expoConfig?.extra?.eas?.projectId`
3. Returns `null` if projectId is missing or placeholder
4. Returns the Expo push token string

### Replaced 3 call sites:
| Location | Before | After |
|----------|--------|-------|
| `useEffect` (load quiet hours, ~line 128) | 4 lines of projectId + token fetch | `const token = await getExpoPushToken(); if (!token) return;` |
| `saveQuietHours` callback (~line 155) | 4 lines of projectId + token fetch | Same pattern |
| `handleSignOut` (~line 210) | 7 lines with nested `if` + try/catch | Same pattern, flattened |

## Verification
- `npx tsc -p tsconfig.json --noEmit` — clean pass
