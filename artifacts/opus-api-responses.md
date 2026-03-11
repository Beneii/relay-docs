# API Response Shape Standardization

## Created
- **`api/_response.ts`** — Central helpers `jsonOk(res, data?, status=200)` and `jsonError(res, status, message)`
  - Success: `{ ok: true, ...data }`
  - Error: `{ ok: false, error: string }`

## Updated Files (11 total)

| File | Changes |
|------|---------|
| `api/update-member.ts` | All responses → jsonOk/jsonError |
| `api/invite-member.ts` | All 12 response calls updated |
| `api/accept-invite.ts` | All 9 response calls updated |
| `api/heartbeat.ts` | All 7 response calls updated |
| `api/heartbeat-check.ts` | All 4 response calls updated |
| `api/outbound-webhooks.ts` | All ~16 response calls updated |
| `api/send-welcome.ts` | All response calls updated |
| `api/_billing.ts` | Both checkout + portal handlers updated |
| `api/_stripeWebhook.ts` | 405 error + 2 json responses updated; raw `send()` calls left as-is |
| `api/health.ts` | 405 error only (HealthResponse format preserved for status page) |

## Intentionally Skipped
- **`api/ping.ts`** — Already returns `{ ok: true, ... }`
- **`api/health.ts`** (partial) — HealthResponse is a structured status-page format, not a CRUD response
- **`api/_stripeWebhook.ts`** `res.send()` calls — Raw string responses for Stripe signature errors and webhook processing failures (no JSON body needed)

## Typecheck
`npx tsc -p tsconfig.json --noEmit` — passed clean
