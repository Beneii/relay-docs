RESULT: done
FILES CHANGED:
- src/features/dashboard/types.ts, useDashboardPage.ts, RecentNotificationsPanel.tsx — notification records now include severity/channel/pushed_count/actions, panel shows badges, channel tags, push counts, and action tags.
- backend/supabase/migrations/00012_hmac_signatures.sql — added request_signature column to notifications.
- backend/supabase/functions/notify/index.ts — generates HMAC signatures, stores/publishes them, tracks pushed_count.
- packages/sdk/src/types.ts, relay.ts, verify.ts, index.ts — SDK now exposes actions/severity/channel on NotifyOptions/NotifyResponse and exports a verifySignature helper using Web Crypto.
OUTPUT:
- npm run typecheck
- (cd packages/sdk && npx tsc)
CONFIDENCE: 0.76
