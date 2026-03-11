# Medium Fixes

## 1. `api/heartbeat-check.ts` — Typed `isStale` parameter

**Problem**: `isStale(app: any)` had zero type safety.

**Fix**: Added `HeartbeatApp` interface matching the select query shape (`id`, `name`, `webhook_token`, `heartbeat_interval_minutes`, `heartbeat_last_seen_at`, `heartbeat_alerted_at`). Changed signature to `isStale(app: HeartbeatApp)`.

## 2. `app/app/edit-app.tsx` — AbortController cleanup on manifest fetch

**Problem**: Rapid URL changes triggered concurrent manifest fetches with no cancellation. Stale responses could overwrite newer state.

**Fix**: Moved `AbortController` creation outside the `setTimeout` callback so the cleanup function can abort it. The effect cleanup now calls both `clearTimeout(timer)` and `controller.abort()`. Added `controller.signal.aborted` checks after `fetch()` and `res.text()` to bail early if the effect was cleaned up mid-flight.

## 3. `src/features/dashboard/useDashboardPage.ts` — Clipboard

**Status**: Already fixed. `handleCopyToken` at line 320 has `try/catch` around `navigator.clipboard.writeText()`. No changes needed.

## 4. `backend/supabase/functions/notify/index.ts` — Magic number extraction

**Problem**: `1440` (minutes per day) used inline in quiet hours calculation.

**Fix**: Added `const MINUTES_PER_DAY = 1440` to the constants block. Replaced both occurrences in the `isInQuietHours` function.

## Typecheck

`npx tsc -p tsconfig.json --noEmit` — clean.
