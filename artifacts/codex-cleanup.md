RESULT: done
FILES CHANGED:
- src/components/OAuthIcons.tsx (new) — centralizes the GitHub/Google SVG icons so Login/Signup can reuse one source.
- src/hooks/useOAuth.ts (new) — shared hook managing OAuth loading/error state and redirect logic.
- src/pages/Login.tsx, src/pages/Signup.tsx, src/pages/ResetPassword.tsx — removed unused React default import, wired up useOAuth + shared icons, and cleaned form types.
- app/app/(tabs)/index.tsx — dashboard limit alert now uses FREE_LIMITS.dashboards instead of a hardcoded 3.
OUTPUT: npm run typecheck
CONFIDENCE: 0.67
