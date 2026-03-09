# Relay — Webhook API Examples

Find your webhook token in the app: edit a saved app → copy webhook URL.

## Basic Notification

```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/notify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_WEBHOOK_TOKEN",
    "title": "Build completed",
    "body": "All tests passed. Ready for review."
  }'
```

## With Event Type and Metadata

```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/notify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_WEBHOOK_TOKEN",
    "title": "Deploy succeeded",
    "body": "v2.1.0 is live on production",
    "eventType": "deploy.success",
    "metadata": {
      "version": "2.1.0",
      "environment": "production",
      "commit": "abc123f"
    }
  }'
```

## Minimal (Title Only)

```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/notify \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_WEBHOOK_TOKEN", "title": "Server restarted"}'
```

## From a Script

```bash
#!/bin/bash
RELAY_URL="https://YOUR_PROJECT.supabase.co/functions/v1/notify"
RELAY_TOKEN="YOUR_WEBHOOK_TOKEN"

relay_notify() {
  curl -s -X POST "$RELAY_URL" \
    -H "Content-Type: application/json" \
    -d "{\"token\": \"$RELAY_TOKEN\", \"title\": \"$1\", \"body\": \"$2\"}"
}

# Usage
relay_notify "Backup complete" "Database backup finished at $(date)"
```

## From GitHub Actions

```yaml
- name: Notify Relay
  run: |
    curl -X POST "${{ secrets.RELAY_URL }}" \
      -H "Content-Type: application/json" \
      -d '{
        "token": "${{ secrets.RELAY_TOKEN }}",
        "title": "CI: ${{ github.event.head_commit.message }}",
        "body": "Workflow ${{ github.workflow }} completed",
        "eventType": "ci.complete"
      }'
```

## Request Body

| Field       | Type   | Required | Description                                    |
|-------------|--------|----------|------------------------------------------------|
| `token`     | string | yes      | Your app's webhook token                       |
| `title`     | string | yes      | Notification title                             |
| `body`      | string | no       | Notification body text                         |
| `eventType` | string | no       | Machine-readable event type, e.g. `deploy.success` |
| `metadata`  | object | no       | Arbitrary JSON stored with the notification    |

## Response Format

### Success (200)
```json
{
  "success": true,
  "notificationId": "550e8400-e29b-41d4-a716-446655440000",
  "pushed": 2
}
```

### Error — Invalid Token (401)
```json
{
  "error": "Invalid webhook token"
}
```

### Error — Notifications Disabled (403)
```json
{
  "error": "Notifications disabled for this app"
}
```

### Error — Bad Request (400)
```json
{
  "error": "title is required"
}
```
