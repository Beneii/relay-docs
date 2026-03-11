RESULT: done
FILES CHANGED:
- src/features/dashboard/OnboardingBanner.tsx, src/pages/Dashboard.tsx — added first-run onboarding banner with copyable SDK snippet, add/test CTAs, and localStorage dismissal so new users see a guided path.
- src/features/dashboard/types.ts, app/app/edit-app.tsx — dashboards now track heartbeat settings and the edit form exposes interval controls, last-seen status, and heartbeat API instructions.
- backend/supabase/migrations/00013_heartbeat.sql, api/heartbeat.ts, api/heartbeat-check.ts, vercel.json — added heartbeat columns plus serverless endpoints (ping + scheduled checker) with Vercel cron wiring to send critical alerts when heartbeats are missed.
OUTPUT:
- npm run typecheck
CONFIDENCE: 0.71
