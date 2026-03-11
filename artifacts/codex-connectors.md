# Automation Connectors Plan

## 1. Database schema
- Create `public.outbound_webhooks` table with columns:
  - `id uuid primary key default uuid_generate_v4()`
  - `user_id uuid references profiles(id) on delete cascade`
  - `app_id uuid references apps(id) on delete cascade`
  - `url text not null` (validated https)
  - `secret text` (optional HMAC secret for signing outbound posts)
  - `provider text` (enum: `custom`, `zapier`)
  - `created_at timestamptz default now()`
  - `last_triggered_at timestamptz`
  - unique constraint on (app_id, provider) so each app has at most one Zapier hook and one custom hook, and optional multiple custom entries if needed (decision: allow multiple? start with one per provider).
- Add policy (RLS) allowing owners of the app (including shared members with manage permission) to insert/update/delete their webhooks.

## 2. API endpoint
- Add `api/outbound-webhooks.ts` (REST) that supports:
  - `GET /api/outbound-webhooks?appId=` -> returns existing webhooks for that app.
  - `POST` -> body `{ appId, url, provider, secret? }` validates ownership, saves/updates row.
  - `DELETE /api/outbound-webhooks/:id` -> removes the webhook.
- Authentication via Supabase auth (same as other API routes), reuse helper to require user.
- For Zapier quick-setup, optionally generate a unique secret automatically and return it to the client.

## 3. Edge function modifications (`backend/supabase/functions/notify/index.ts`)
- After storing notification (current logic), load `outbound_webhooks` for the app (`select url, secret, provider`).
- For each, POST JSON payload:
  ```json
  {
    "app_id": "uuid",
    "notification_id": "uuid",
    "title": "...",
    "body": "...",
    "severity": "info|warning|critical",
    "channel": "...",
    "metadata": { ... },
    "actions": [...],
    "timestamp": "ISO",
    "provider": "zapier|custom"
  }
  ```
- If secret present, sign body with `sha256=...` header (HMAC secret). Include headers `X-Relay-App`, `X-Relay-Provider`.
- Retry logic: basic (3 attempts) or log failure.
- For Zapier documentation, instruct users to paste the webhook URL from Zapier’s “Catch Hook”.

## 4. Zapier trigger compatibility
- Provide instructions/screens in Docs + Dashboard explaining how to paste Zapier URL. Since Zapier expects specific shape, ensure JSON matches their default catch-all (no special format required). Optionally include query param `?source=relay-zapier` so docs can detect.

## 5. UI integration
- In edit-app or dedicated “Automation” section: allow users to add a Zapier URL and/or generic webhook. Show status (last triggered, errors). Use new API endpoints to save/delete.

## 6. Future considerations
- Rate limiting outbound posts per app to avoid user mistakes.
- Logging failures for display in delivery logs.
