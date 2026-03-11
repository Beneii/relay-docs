# Loop 1 Council: Highest-Impact Work

## 1. Publish @relayapp/sdk to npm and confirm migration 00011

**Why first:** The entire pivot narrative is "npm install @relayapp/sdk" — but a vibe-coder who runs that command right now gets nothing. The SDK exists locally but isn't published. Similarly, if migration 00011 (interactive notification columns: severity, channel, actions_json, deep_link_url) hasn't been applied to production Supabase, then every notification with actions/severity/channel will fail silently or 500 at the insert. These two items are blockers — every other feature is built on top of them, and every marketing claim on the landing page and docs is a lie until they're done. Both are zero-code-change tasks (npm publish + supabase db push), making them the highest ratio of impact to effort in the entire backlog.

## 2. Notification delivery log in the web dashboard

**Why second:** The #1 support question for any webhook-based product is "I sent a webhook but nothing happened — is it my fault or yours?" Without delivery logs, a developer has zero visibility: they don't know if the notification was received, stored, or pushed to a device. This kills trust fast and drives churn before users even reach the upgrade decision. Build a simple table on the dashboard page showing the last N notifications per app: timestamp, title, severity, push status (delivered/no-devices/failed), and a "copy payload" button. The data already exists in the `notifications` and `push_tickets` tables — this is a read-only UI over existing data, probably 200-300 lines of React. It's the single most trust-building feature missing from the product.

## 3. React error boundaries at the route level

**Why third:** There are zero error boundaries in the React app. A single uncaught error in any component — a null reference from a Supabase response, a malformed notification record, a Stripe edge case — crashes the entire SPA with a white screen. For a product that positions itself as infrastructure ("never miss an alert"), a white screen is catastrophic to credibility. Add a route-level `<ErrorBoundary>` that catches render errors and shows a "Something went wrong — reload" card instead of a blank page. This is ~50 lines of code with outsized risk reduction. Every day without it is a day where a single bad data row can make the whole app appear broken to every user who visits.

CONFIDENCE: 0.90
