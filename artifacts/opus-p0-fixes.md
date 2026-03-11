# P0 Fixes

## 1. api/_billing.ts — Import extension fix
- **Line 4:** Changed `"./_cors.ts"` to `"./_cors.js"`
- **Why:** Vercel's `nodeFileTrace` cannot resolve `.ts` imports at runtime. The function would crash with `ERR_MODULE_NOT_FOUND` on deploy.

## 2. backend/supabase/migrations/00004_quota_triggers.sql — Quota limit fix
- **Line 62:** Changed `ELSE 100` to `ELSE 500`
- **Why:** Free plan notification limit is 500 per `shared/product.ts` (`FREE_LIMITS.notificationsPerMonth`). The trigger was blocking users at 100 — 5x too early.
- **Note:** This migration needs to be re-applied to production (or a new migration created with `CREATE OR REPLACE FUNCTION` to update the trigger function).

## 3. Test assertions — Already correct
- `tests/shared/product.test.ts:15` — Already asserts `notificationsPerMonth: 500`
- `app/src/__tests__/limits.test.ts:17` — Already asserts `toBe(500)`
- These were fixed in a previous loop. No changes needed.

## Verification
- `npx tsc -p tsconfig.json --noEmit` — clean pass, no errors.
