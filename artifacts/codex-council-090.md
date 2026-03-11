1. **Action audit log + webhook receipts** — Pro users get a searchable log of every notification/action POST (timestamp, payload, response) so they can debug agent workflows without adding their own logging layer.
2. **Secure approval flows** — Require Face ID / local passcode before executing destructive notification actions, plus configurable multi-step confirmations for production bots.
3. **Relay automations** — Built-in rules engine that triggers follow-up notifications, throttles noisy channels, or pauses agents when certain metadata thresholds hit.
4. **Custom runtime bundles** — Upload a React dashboard bundle to Relay and get offline caching, prefetching, and versioned rollbacks instead of relying solely on external hosting.
5. **Private relay domains** — Point a custom domain (e.g., relay.yourbot.dev) so webhook endpoints and relay.json fetches stay within your own DNS, improving trust with enterprise firewalls.
6. **Device targeting + scheduling** — Send a notification to specific enrolled devices, set quiet hours per channel, and schedule when alerts fan out—essential for teams sharing monitoring duties.
7. **Secrets vault + header injection** — Store API keys in Relay and inject them as headers into your dashboard webview so your custom tool can call internal APIs without baking secrets into the client.
8. **Agent health dashboard** — Aggregated view of all agent notifications, error rates, and most-triggered actions, giving Pro users visibility into which bots need attention.
