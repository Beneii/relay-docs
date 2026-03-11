# Council Verdict: Is Relay Reformed?

**RESULT: partially-reformed**

The landing page and SDK represent a genuine repositioning toward developer infrastructure. The edge function has real interactive notification capabilities. But several layers of the product still contradict the new story, and the reform is incomplete in ways that would confuse a real user trying to adopt Relay today.

---

## CONSISTENCY

### What's Aligned

**Landing page (App.tsx):** Fully reformed. The hero says "The mobile runtime for tools you build with AI." The feature cards reference SDK, native runtime, auth-as-a-header, and interactive webhooks. The use case cards target "The Vibe-Coder," "The AI Agent Builder," and "The Home Automator." The how-it-works steps lead with URL, SDK, then app. The code demo shows `import { Relay } from '@relayapp/sdk'` with an actions array. This is consistent, targeted developer copy.

**SDK (packages/sdk/):** Aligned. `Relay` class, `relayConfig()` manifest helper, token validation, `relayapp.dev/webhook` endpoint, 10s timeout, 5xx retry. The exports are clean and the DX is good.

**Notify edge function:** Aligned. Accepts `actions`, `severity`, `channel`, `url` (deep link). Validates HTTPS on action URLs, enforces unique labels, slugifies channels. The interactive notification capabilities are real and differentiated.

**Integration examples (content.ts):** First tab is Node.js with SDK import. Bash, GitHub Actions, Python follow. SDK-first ordering is correct for the new positioning.

### What Still Contradicts

**1. Pricing page still shows $7.99/month.** The council recommended $5/month. The pricing page hardcodes `'$7.99'` / `'$79'` / `'$6.58'` — these aren't from the shared product config, they're string literals. The strategy doc said drop the price to impulse-buy territory. This wasn't done.

**2. Free tier is still 100 notifications, not 500.** `backend/shared/product.ts` line 6: `notificationsPerMonth: 100`. The pricing page line 128 says `'500 notifications / month'` — but this is a hardcoded display string that **lies**. The actual limit enforced by the edge function and DB triggers is still 100. A free user who sends notification #101 will get a 429 error, even though the pricing page promised 500. **This is a bug that will erode trust.**

**3. FAQ content is half-old, half-new.** `content.ts` FAQ items still say "mobile command center for web dashboards" and "mobile companion for dashboards and automation systems." The first FAQ answer: "Save any web dashboard as a native app on your phone" — this is the old consumer positioning. It should say something about developer tools, SDK, and the builder audience. The SDK FAQ at the end is new, but 7 of 9 FAQs are pre-pivot copy.

**4. Pricing page copy says "For power users and professional teams"** — this is consumer language, not dev-tool language. Dev tools say "For production workloads" or "For teams shipping to users." Minor but noticeable alongside the reformed landing page.

**5. The hero terminal demo still shows raw `curl`.** Line 203-205 of App.tsx: the animated terminal widget shows `curl -X POST relayapp.dev/webhook` — but the new positioning leads with the SDK. The terminal demo should show the SDK code, or at minimum show `npx @relayapp/sdk notify "Build passed"` to be consistent with step 02 ("Drop in the SDK").

**6. The phone notification in the hero still says "Tap to open Grafana."** Line 268. Grafana is a consumer/self-hosted tool reference. The new audience is vibe-coders building their own dashboards. Should say something like "Tap to open Agent Dashboard" or "Tap to open your dashboard."

**7. "View Documentation" button links to `/docs` which doesn't exist.** Line 174. There's no docs page. A vibe-coder who clicks this gets a 404. This is worse than not having the button at all.

---

## SDK_VERDICT

**Would a vibe-coder actually use this? Yes, conditionally.**

The SDK itself is well-designed:
- `new Relay({ token })` then `await relay.notify({ title, body })` — clean, minimal API
- Token format validation catches typos early with helpful error messages
- 10s timeout prevents hanging in CI/CD scripts
- 5xx retry with backoff handles transient failures
- `relayConfig()` manifest helper is a nice touch for relay.json generation
- Zero dependencies — doesn't bloat the user's project

**But the SDK is missing the interactive notification types.** The `NotifyOptions` type in `packages/sdk/src/types.ts` has `title`, `body`, `eventType`, `metadata`, `url` — but NOT `actions`, `severity`, or `channel`. These fields exist in the edge function and are featured on the landing page, but the SDK can't send them. A vibe-coder who reads the landing page code demo (which shows `actions: [{ label: 'View Report', url: '...' }]`) and then installs the SDK will find that `actions` isn't a valid property on `NotifyOptions`. **The hero demo advertises a feature the SDK doesn't support.**

The SDK also lacks:
- `actions` field (the primary differentiator)
- `severity` field
- `channel` field
- No README with quickstart (the SDK has a README but I didn't see it read — may exist)
- Not published to npm yet (can't `npm install` it)

A raw `curl` POST can use all the new fields. The SDK can't. This inverts the intended experience: the SDK should be the superior path, not the inferior one.

---

## DIFFERENTIATORS

What genuinely sets Relay apart from ntfy/Pushover now:

1. **Interactive action buttons.** No other webhook-to-push service lets you add action buttons that POST back to your server. This is a real, defensible feature. A developer can send a notification "Agent needs approval" with a "Approve" button that POSTs to their API — the user never opens the app. This is new and valuable.

2. **Deep link to specific dashboard path.** Send `url: "/trades/latest"` and the notification opens that exact page in the webview. ntfy opens a URL in the browser. Relay opens it inside the native app context. Small difference, but it's the right kind of native-feeling behavior.

3. **The webview runtime itself.** No competitor wraps arbitrary URLs as native apps with notification deep-linking. This is the actual moat — it's not just a notification service, it's a mobile shell for web tools.

4. **Severity-based push behavior.** Critical notifications get different sound/priority on Android. This is a nice touch, though Pushover also has priority levels.

5. **relay.json manifest auto-configuration.** No competitor has a manifest format for auto-configuring mobile app behavior. This is forward-thinking, though its value depends on adoption.

---

## GAPS

### 1. SDK doesn't support the new notification fields (actions, severity, channel)

This is the most critical gap. The entire pivot story is "use our SDK to send interactive notifications from your vibe-coded tool." But the SDK can only send `title` and `body`. The interactive features — the main differentiator — are only accessible via raw HTTP. This makes the SDK a downgrade from curl, which defeats the purpose.

**Fix:** Add `actions?: RelayAction[]`, `severity?: RelaySeverity`, `channel?: string` to `NotifyOptions` and `RelayRequestBody`.

### 2. Free tier limit mismatch (pricing page says 500, backend enforces 100)

A user who trusts the pricing page and sends 101 notifications will get rate-limited. This is a trust-breaking bug. Either update `product.ts` to 500 or fix the pricing page display.

### 3. No documentation exists

The "View Documentation" CTA links to `/docs` which 404s. For a dev tool, documentation isn't optional — it's the product. A vibe-coder who can't find API docs, SDK reference, or a quickstart guide won't adopt Relay. At minimum: a single `/docs` page with the SDK quickstart, API reference (fields, limits, errors), and a relay.json example.

---

## OVERALL

Relay is **partially reformed**. The strategic intent is clear and the highest-value work was done: the landing page speaks to developers, the SDK exists and is well-structured, and the edge function has genuine interactive notification capabilities that differentiate Relay from free alternatives. The architecture changes are real, not cosmetic.

But the reform is leaky. The pricing page advertises a free tier limit the backend doesn't enforce. The SDK can't send the interactive features that the landing page demos. The FAQs are still written for the old audience. The hero terminal shows curl instead of the SDK. The docs page 404s. These aren't minor polish issues — they're the specific touchpoints where a real user would discover the gap between what Relay claims to be and what it actually is today.

The foundation is there. The pivot is directionally correct and architecturally real. But a vibe-coder who arrives at relayapp.dev today, reads the landing page, installs the SDK, and tries to send an interactive notification will hit a wall within 5 minutes. That gap between promise and delivery is the difference between "partially reformed" and "reformed."

**Fix the SDK types, fix the free tier number, add a docs page, and this moves to "reformed."**

**CONFIDENCE: 0.84**
