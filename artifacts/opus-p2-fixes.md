# P2 Fix: Shared Supabase Client

## Created: api/_supabase.ts
Exports two functions:
- `getServiceClient()` — singleton service-role client with `persistSession: false`. Uses `requireEnv` from `_env.js`.
- `getUserClient(token)` — creates a user-scoped client with the JWT in the Authorization header.

## Updated files (10 total)

### Pattern 1 — Had inline requireEnv + createClient with auth options:
| File | Changes |
|------|---------|
| `api/_auth.ts` | Removed `createClient` import, local `requireEnv`, inline client. Now imports `getServiceClient` from `'./_supabase.js'`. Also changed `import { createClient, type User }` to `import type { User }`. |
| `api/update-member.ts` | Same — removed `createClient`, `requireEnv`, inline client. |
| `api/invite-member.ts` | Same. |
| `api/accept-invite.ts` | Same. |
| `api/outbound-webhooks.ts` | Same. |
| `api/send-welcome.ts` | Same. |

### Pattern 2 — Had inline requireEnv + createClient without auth options:
| File | Changes |
|------|---------|
| `api/create-checkout.ts` | Removed `createClient` import + inline client. Kept local `requireEnv` (still needed for `STRIPE_SECRET_KEY`). |
| `api/create-billing-portal.ts` | Removed `createClient` import + inline client. Kept `requireEnv` from `_env.js` (for Stripe). |
| `api/stripe-webhook.ts` | Removed `createClient` import + inline client. Kept local `requireEnv` (for Stripe keys). |

### Pattern 3 — Had intermediate variables:
| File | Changes |
|------|---------|
| `api/heartbeat.ts` | Removed `createClient`, `requireEnv`, `supabaseUrl`, `supabaseKey`. Now just `getServiceClient()`. |
| `api/heartbeat-check.ts` | Removed `createClient`, `supabaseKey`. Kept `supabaseUrl` (used for `notifyUrl`). Client now from `getServiceClient()`. |

### Skipped:
| File | Reason |
|------|--------|
| `api/health.ts` | Intentionally creates client inside handler to gracefully handle missing env vars (returns "degraded" status instead of crashing). |

## Verification
- `npx tsc -p tsconfig.json --noEmit` — clean pass
