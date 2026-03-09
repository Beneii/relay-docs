# Dashboard webhook test button

Updated `src/pages/Dashboard.tsx`.

## Webhook test action

- Each dashboard row now includes a small secondary `Test` button with a `Zap` icon beside the webhook token actions.
- The button sends a POST request to:
  - ``${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify/${app.webhook_token}``
- Payload:
  - `title: 'Test notification'`
  - `body: 'Your webhook is working!'`
- Inline per-app feedback is shown for about 2 seconds:
  - `Testing`
  - `Sent!`
  - `Failed`

## Empty state

- Improved the no-apps state into a more helpful centered onboarding card.
- It now explains what Relay does and walks the user through:
  - adding a dashboard
  - copying a webhook URL
  - receiving push notifications

## Notes

- The dashboard already had most of the test-webhook request/state logic in place.
- This pass refined the button styling to better match the requested small secondary design and expanded the empty-state instructions.
