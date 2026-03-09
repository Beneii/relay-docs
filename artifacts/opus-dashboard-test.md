# Dashboard Test Webhook & Empty State

**File:** `src/pages/Dashboard.tsx`
**Status:** Already implemented — no changes needed

## Test Webhook Button

- **Handler:** `handleTestWebhook` (lines 319-338)
- **Endpoint:** `POST ${VITE_SUPABASE_URL}/functions/v1/notify/${webhook_token}`
- **Body:** `{ title: "Test notification", body: "Your webhook is working!" }`
- **UI:** Inline next to the Copy button (lines 721-735)
  - Idle: Zap icon + "Test"
  - Loading: Spinner + "Testing"
  - Success: Green check + "Sent!" (auto-clears after 2s)
  - Error: Red zap + "Failed" (auto-clears after 2s)
- Button is disabled while a test is in progress (`testingId` state)

## Empty State (No Apps)

- **Location:** Lines 680-696
- **Trigger:** `dashboards.length === 0`
- **UI:** Dashed border card with Webhook icon, "Add your first app" heading, description, and "Add App" button that opens the add dashboard modal
