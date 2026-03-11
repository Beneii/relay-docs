# Relay Pro: Value-Add Features for Builders — Gemini Council

1. **Multiple Webhook Environments:** Support for `dev`, `staging`, and `prod` environments per dashboard with isolated notification histories and custom routing rules.
2. **Notification Action Chains:** The ability for a single action button to trigger a sequence of multiple POST requests to different endpoints, handled entirely by the Relay backend.
3. **End-to-End Encrypted Metadata:** Secure, client-side encrypted storage for the `metadata` JSON object, ensuring sensitive dashboard data is never readable by Relay's servers.
4. **Custom Bridge JS Injections:** Pro-only capability to inject custom JavaScript into wrapped dashboards via the `relay.json` manifest to enable native mobile features like haptics and biometrics.
5. **Real-time Delivery Analytics:** A dedicated developer dashboard showing precise webhook delivery latency, action button success rates, and detailed logs for debugging `relay.json` fetch errors.
6. **Collaborative Dashboard Sharing:** Granular permissioning that allows Pro users to share specific dashboards and notification streams with teammates without sharing account credentials or master tokens.
7. **Heartbeat & Silent-Failure Monitoring:** Built-in "Dead Man's Switch" that triggers an alert if an agent or dashboard fails to send a heartbeat webhook within a user-defined interval.
8. **Durable Action Queuing:** An automated retry mechanism that queues failed notification action POSTs for up to 24 hours, ensuring commands are delivered even if the developer's server is temporarily offline.
