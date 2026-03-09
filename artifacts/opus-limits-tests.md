# Limits Constants Tests

**File:** `app/src/__tests__/limits.test.ts`
**Status:** 8/8 passing

## What's tested

### FREE_LIMITS
- `dashboards` === 3
- `devices` === 1
- `notificationsPerMonth` === 100

### PRO_LIMITS
- `dashboards` === Infinity (unlimited)
- `devices` === 10
- `notificationsPerMonth` === 10,000

### getLimits(plan)
- `"free"` returns `FREE_LIMITS` (reference equality)
- `"pro"` returns `PRO_LIMITS` (reference equality)

## Notes
- Supabase, auth store, and react-query are mocked since the test only covers exported constants and the `getLimits` helper — no network or React rendering needed.
