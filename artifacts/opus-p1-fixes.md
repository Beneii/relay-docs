# P1 Fixes

## 1. DashboardListSection.tsx — Dynamic WEBHOOK_BASE
- **Line 23:** Changed `'https://relayapp.dev/webhook'` to `` `${window.location.origin}/webhook` ``
- **Why:** Hardcoded production URL broke local dev and staging. `window.location.origin` resolves correctly in all environments.

## 2. api/_validators.ts — Created shared validation helpers
New file with three exports:
- `assertEnum<T>(value, allowed, fieldName)` — validates value is one of the allowed strings, returns typed result, throws `ValidationError` if not
- `assertString(value, fieldName)` — validates value is a non-empty string, throws `ValidationError` if not
- `ValidationError` — custom error class for clean catch/rethrow in handlers

## 3. api/update-member.ts — Refactored to use validators
- Added import: `assertEnum`, `assertString`, `ValidationError` from `'./_validators.js'`
- Replaced inline `if` checks with `assertString(memberId, 'memberId')` and `assertEnum(rawRole, ['viewer', 'editor'], 'role')`
- `ValidationError` caught and returned as 400; other errors rethrown
- Behavior unchanged — same 400 responses for invalid input, now with reusable validators

## Verification
- `npx tsc -p tsconfig.json --noEmit` — clean pass
