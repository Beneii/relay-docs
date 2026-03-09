# Test Run & New Tests

## Test Results: All 30 tests pass

```
PASS src/__tests__/url.test.ts
PASS src/__tests__/limits.test.ts
PASS src/__tests__/time.test.ts

Test Suites: 3 passed, 3 total
Tests:       30 passed, 30 total
```

## Issues Found & Fixed

### 1. Existing `time.test.ts` had a test for removed weeks bucket
- Old test expected `timeAgo(14 days)` → `"2w ago"`. After the utils audit removed the weeks bucket, this returned `"14d ago"`.
- Updated test to expect `"14d ago"`.

### 2. Second gap bug in timeAgo: months→years transition
- `days=364`: `months = floor(364/30) = 12`, `months < 12` was false, fell through to `years = floor(364/365) = 0` → `"0y ago"`.
- **Fix:** Changed the months threshold from `months < 12` to `days < 365`. This ensures any day count under 365 stays in the months bucket, and only 365+ goes to years.

## New Tests Added

### `time.test.ts` — Edge case coverage

1. **Days boundary at 29**: `daysAgo(29)` → `"29d ago"` (stays in days, not months)
2. **Exactly 30 days = 1 month**: `daysAgo(30)` → `"1mo ago"` (transitions to months)
3. **364 days = 12 months**: `daysAgo(364)` → `"12mo ago"` (stays in months, not years)
4. **Exactly 365 days = 1 year**: `daysAgo(365)` → `"1y ago"` (transitions to years)
5. **730 days = 2 years**: `daysAgo(730)` → `"2y ago"`
