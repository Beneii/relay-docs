# P3 Polish

## 1. Console.log cleanup

No `console.log` calls found in `src/`, `api/`, or `app/` — they were already removed in earlier passes.

Remaining `console.error` calls (intentionally kept):
- `app/app/(tabs)/settings.tsx:147` — quiet hours load failure
- `app/app/(tabs)/settings.tsx:169` — quiet hours save failure
- `app/app/(tabs)/settings.tsx:218` — device deregistration failure on sign-out

These are genuine error paths that aid mobile debugging.

## 2. Unused imports removed

| File | Removed imports |
|------|----------------|
| `src/App.tsx:4` | `LayoutDashboard`, `CheckCircle2`, `Gauge`, `Rocket`, `Activity`, `TrendingUp`, `MonitorSmartphone`, `Network` (8 unused lucide icons) |
| `src/components/RelayLogo.tsx:1` | `import React from 'react'` (not needed with modern JSX transform) |
| `src/components/ThemeToggle.tsx:1` | `React` from `import React, { useEffect, useState }` |
| `src/features/dashboard/OutboundWebhooksSection.tsx:2` | `Check` from lucide-react |
| `src/main.tsx:3` | `Link` from react-router-dom |

## Verification
- `npx tsc -p tsconfig.json --noEmit --noUnusedLocals` — clean pass, zero warnings
