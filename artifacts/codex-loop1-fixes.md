RESULT: done
FILES CHANGED:
- backend/supabase/migrations/00012_hmac_signatures.sql — added pushed_count column alongside request_signature.
- backend/supabase/functions/notify/index.ts — now attaches callbackToken per notification, includes it in push payloads, and still stores request_signature/pushed_count.
- app/src/hooks/useNotificationHandler.ts — action callbacks now send x-relay-signature using expo-crypto and include the notification metadata.
- packages/sdk/src/types.ts, verify.ts, index.ts — NotifyResponse carries signature, verifySignature API now derives callback tokens via webhook token + notificationId.
OUTPUT:
- npm run typecheck
- (cd packages/sdk && npx tsc)
CONFIDENCE: 0.75
