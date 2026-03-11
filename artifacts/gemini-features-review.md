# Feature Review: White-Labeling & Automation Connectors — Gemini Council

## 1. White-Labeling (Custom Branding)
**High Risks:**
*   **Accessibility & Contrast Failures:** Allowing arbitrary accent colors via the UI or `relay.json` is a major UX risk. If a user chooses a light color (e.g., #FFFFFF) on a light theme, or a dark one on dark theme, critical UI elements like "Save" or "Close" buttons may become invisible. 
*   **Icon Delivery Performance:** Fetching and rendering dozens of high-res external icons in the mobile app's main list will cause scrolling stutter and high data usage if not properly cached and resized on the backend.

**Edge Cases:**
*   **The "404 Icon":** If a user points to an icon URL that goes down or returns a 403, the app list will look broken. We need a high-quality "fallback" generator that uses the app's first letter and accent color.
*   **Malicious/Large Assets:** Users might point to 10MB PNGs or SVG-based injection vectors in the `icon` field.
*   **Home Screen Persistence:** If we eventually support Dynamic Icons (iOS/Android), what happens if the user deletes the app while a custom icon is active? (OS-level edge case).

**Launch Embarrassment:**
*   The "Aha!" moment of setting a custom color immediately followed by the "Oh no" moment of the app becoming unusable because the "Back" button is now the same color as the background.

## 2. Automation Connectors (Outbound Webhooks)
**High Risks:**
*   **Recursive Notification Storms:** This is the #1 risk. A user sets an outbound webhook to an n8n flow that, in turn, sends a notification back to the same Relay app. Without "Loop Detection" headers (e.g., `x-relay-loop-id`), this will create an infinite, credit-draining loop that could crash our edge functions.
*   **SSRF (Server-Side Request Forgery):** A malicious user could set the "Zapier URL" to `http://localhost:54321` or an internal Supabase metadata service, using Relay as a proxy to probe our internal infrastructure.

**Edge Cases:**
*   **The "Slow Target":** If a user's Make.com webhook takes 9 seconds to respond, does it block our push notification delivery? Outbound webhooks **must** be processed asynchronously (queued) to prevent slowing down the core "buzz" experience.
*   **Payload Bloat:** If the inbound notification has 4KB of metadata, and the outbound webhook adds more headers/wrapper, we might hit target service payload limits.
*   **Varying Success Codes:** Some services return `201 Created` or `202 Accepted`. A naive check for `200 OK` will mark these as "Failed" in our logs.

**Launch Embarrassment:**
*   A user's Zapier account is suspended because Relay sent 5,000 recursive notifications in 10 seconds, and we have no way to "Kill" the outbound webhook stream from the dashboard.

## Final Recommendation
*   **White-label:** Implement a "Luminance Check" on accent colors to ensure they meet a minimum contrast ratio against the background.
*   **Connectors:** Implement an **Outbound Allowlist** (https only) and mandatory **Loop Detection** headers. All outbound POSTs must be handled by a non-blocking background worker.
