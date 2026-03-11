# Loop 10 Plan: Product Config Centralization + Final Polish

## Audit Results

### Hardcoded price strings (must centralize)

| File | Line | Hardcoded value |
|------|------|-----------------|
| `src/pages/Pricing.tsx` | 122-124 | `$7.99`, `$79`, `$6.58` |
| `src/pages/Pricing.tsx` | 128 | `'500 notifications / month'` (should use `FREE_LIMITS.notificationsPerMonth`) |
| `src/pages/Pricing.tsx` | 173 | `Save 17%` |
| `src/pages/Docs.tsx` | 566 | `'Pro ($7.99/mo)'` |
| `src/pages/Docs.tsx` | 570 | `'500'`, `'10,000'` |
| `app/src/components/UpgradePrompt.tsx` | 84 | `Upgrade — $7.99/mo` |
| `app/app/(tabs)/settings.tsx` | 349 | `Upgrade to Pro — $7.99/mo` |

### Stale test assertions (bugs)

| File | Issue |
|------|-------|
| `tests/shared/product.test.ts:15` | Expects `notificationsPerMonth: 100`, actual is `500` |
| `app/src/__tests__/limits.test.ts:16-17` | Expects `FREE_LIMITS.notificationsPerMonth` to be `100`, actual is `500` |

These tests are currently failing or were never run. Must fix.

### Files already using shared config correctly

- `api/_email.ts` — uses `FREE_LIMITS`/`PRO_LIMITS` constants for plan summaries
- `src/features/landing/content.ts` — FAQ uses limits from shared config
- `src/features/dashboard/AccountSidebar.tsx` — uses `FREE_LIMITS`/`PRO_LIMITS`
- `backend/supabase/functions/notify/index.ts` — uses shared limits for enforcement

---

## Implementation Plan

### Step 1: Extend `backend/shared/product.ts`

Add pricing constants:

```ts
export const PRO_PRICING = {
  monthly: {
    price: 7.99,
    label: '$7.99',
    interval: 'month',
  },
  annual: {
    price: 79,
    label: '$79',
    monthlyEquivalent: '$6.58',
    interval: 'year',
    savingsPercent: 17,
  },
  currency: 'USD',
} as const;
```

Add feature list constants (so Pricing.tsx and Docs.tsx reference the same source):

```ts
export const FREE_FEATURES = [
  `${FREE_LIMITS.dashboards} dashboards`,
  `${FREE_LIMITS.devices} device`,
  `${FREE_LIMITS.notificationsPerMonth} notifications/month`,
  '@relayapp/sdk + REST API access',
  'Webhook API access',
] as const;

export const PRO_FEATURES = [
  'Unlimited dashboards & projects',
  `Up to ${PRO_LIMITS.devices} devices`,
  `${PRO_LIMITS.notificationsPerMonth.toLocaleString()} notifications/month`,
  'Interactive action buttons + SDK features',
  'Team sharing & collaboration',
  'Notification history & metadata events',
  'Priority support',
] as const;
```

### Step 2: Update `src/pages/Pricing.tsx`

- Import `PRO_PRICING`, `FREE_FEATURES`, `PRO_FEATURES` from `@shared/product`
- Replace hardcoded `$7.99`, `$79`, `$6.58` with `PRO_PRICING.monthly.label`, `PRO_PRICING.annual.label`, `PRO_PRICING.annual.monthlyEquivalent`
- Replace `Save 17%` with `` Save ${PRO_PRICING.annual.savingsPercent}% ``
- Replace `'500 notifications / month'` with `` `${FREE_LIMITS.notificationsPerMonth} notifications / month` ``
- Use `FREE_FEATURES` and `PRO_FEATURES` arrays to build feature lists

### Step 3: Update `src/pages/Docs.tsx`

- Import `PRO_PRICING`, `FREE_LIMITS`, `PRO_LIMITS` from `@shared/product`
- Line 566: Replace `'Pro ($7.99/mo)'` with `` `Pro (${PRO_PRICING.monthly.label}/mo)` ``
- Line 570: Replace `'500'` with `` `${FREE_LIMITS.notificationsPerMonth}` ``, `'10,000'` with `` `${PRO_LIMITS.notificationsPerMonth.toLocaleString()}` ``

### Step 4: Update mobile app hardcoded prices

**`app/src/components/UpgradePrompt.tsx` line 84:**
- Import `PRO_PRICING` from `@shared/product`
- Replace `$7.99/mo` with `${PRO_PRICING.monthly.label}/mo`

**`app/app/(tabs)/settings.tsx` line 349:**
- Import `PRO_PRICING` from `@shared/product`
- Replace `$7.99/mo` with `${PRO_PRICING.monthly.label}/mo`

### Step 5: Fix stale tests

**`tests/shared/product.test.ts`:**
- Change `notificationsPerMonth: 100` to `notificationsPerMonth: 500`

**`app/src/__tests__/limits.test.ts`:**
- Change assertion from `toBe(100)` to `toBe(500)`
- Change test description from `"allows 100 notifications per month"` to `"allows 500 notifications per month"`

### Step 6: Polish audit — embarrassment check

Items to verify/fix:

| Issue | File | Fix |
|-------|------|-----|
| Docs plan comparison table missing "Team sharing" | `src/pages/Docs.tsx` | Add row for team sharing (Pro only) |
| Pro features list in Pricing.tsx doesn't mention team sharing | `src/pages/Pricing.tsx` | Will be fixed by using `PRO_FEATURES` from shared config which includes it |
| `notify/index.ts` quota email says "unlimited notifications" for Pro | Line 346 | Should say `${limit}` not "unlimited" — actually it says limit correctly, fine |
| Free feature list says "Notification history" is excluded | `Pricing.tsx:132` | Correct — free users get 20 in mobile, 10 in web via `NOTIFICATION_HISTORY_LIMITS` |
| Mobile `NotificationRow` type missing fields | `app/src/types/database.ts` | Covered in loop 9 plan, but should be done regardless |

---

## Files to modify (summary)

| File | Action |
|------|--------|
| `backend/shared/product.ts` | Add `PRO_PRICING`, `FREE_FEATURES`, `PRO_FEATURES` |
| `src/pages/Pricing.tsx` | Replace all hardcoded prices/features with shared constants |
| `src/pages/Docs.tsx` | Replace hardcoded prices/limits in plan comparison table |
| `app/src/components/UpgradePrompt.tsx` | Replace `$7.99` with shared constant |
| `app/app/(tabs)/settings.tsx` | Replace `$7.99` with shared constant |
| `tests/shared/product.test.ts` | Fix stale 100 → 500 assertion |
| `app/src/__tests__/limits.test.ts` | Fix stale 100 → 500 assertion |

## Outcome

After this loop, every plan-related string in the codebase derives from `backend/shared/product.ts`. Changing a price or limit means editing one file. Tests pass. No embarrassing inconsistencies for a journalist or investor to find.
