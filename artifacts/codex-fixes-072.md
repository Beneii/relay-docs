RESULT: done
FILES CHANGED:
- backend/supabase/migrations/00011_notifications_actions.sql — added `deep_link_url` column with length check and tightened indexes to partial user-scoped channel/severity lookups.
- backend/supabase/functions/notify/index.ts — extended request schema/validation for the new `url` field, persisted it as `deep_link_url`, and propagated to Expo payloads.
- packages/sdk/src/manifest.ts — switched manifest schema to snake_case, allowed relative icons, improved channel sanitization messaging, and wired `deep_link_url`-friendly helpers.
OUTPUT:
- `npx tsc -p packages/sdk/tsconfig.json` (success, no output)
CONFIDENCE: 0.72
