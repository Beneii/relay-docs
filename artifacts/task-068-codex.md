RESULT: Added interactive notification fields (actions/severity/channel) end-to-end plus relay.json manifest tooling in the SDK per the Opus spec.

CHANGES:
- Introduced migration `backend/supabase/migrations/00011_notifications_actions.sql` adding `severity`, `channel`, and `actions_json` columns with supporting indexes.
- Extended the notify edge function (`backend/supabase/functions/notify/index.ts`) with validation helpers for severity/channel/actions, storing the new fields, and propagating them through Expo push payloads (including priority/sound tweaks for critical alerts).
- Added a relay.json manifest helper module (`packages/sdk/src/manifest.ts`) that exports typed schema definitions and a `relayConfig` validator, and re-exported it via the SDK entrypoint for developer consumption.

TESTS:
- `npx tsc -p packages/sdk/tsconfig.json`

GAPS/ASSUMPTIONS:
- Did not wire interactive notification handling into the mobile Expo client yet; assumed future task will implement the described UI/response flow.
- Manifest helper currently enforces https/data URI icons and https webhook URLs; if self-hosted developers need other protocols, requirements will need clarification.
- `relayConfig` throws on invalid tab metadata instead of returning warnings; spec mentioned optional warnings so behavior may need refinement based on UX feedback.

CONFIDENCE: 0.73
