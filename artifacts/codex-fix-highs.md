RESULT: done
FILES CHANGED:
- api/invite-member.ts — self-invite prevention now compares lowercase emails to avoid bypass via casing.
- api/_lib/rateLimit.ts — getIp now validates the forwarded header and falls back to req.socket.remoteAddress.
- backend/supabase/functions/notify/index.ts — quota warning errors log to console instead of being swallowed.
- backend/supabase/functions/delete-account/index.ts — allowed origins reduced to exact matches (https://relayapp.dev, relay://app).
OUTPUT: npm run typecheck
CONFIDENCE: 0.71
