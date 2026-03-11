# What Makes Pro Worth Paying For

## Pro-Only Features (Concrete, Buildable)

1. **Webhook delivery logs with replay.** Pro users see a timestamped log of every incoming webhook (status, latency, payload preview) and can tap "Replay" to re-send any notification — essential for debugging flaky agent pipelines.

2. **Scheduled quiet hours with severity override.** Pro users set per-device quiet hours (e.g. 11pm-7am) where only `critical` notifications break through — vibe-coders running overnight jobs need this so they aren't woken by `info` noise but never miss a real failure.

3. **Multi-step action chains.** Pro notifications support sequential actions: "Approve" triggers a POST, waits for the response, and shows a follow-up notification with the result — turning a notification into a two-way conversation with your agent without opening the app.

4. **Custom notification sounds per channel.** Pro users assign distinct sounds to different channels (trades vs deploys vs errors) so they can tell what happened from across the room without looking at their phone.

5. **Webhook request signing (HMAC).** Pro dashboards get an optional webhook secret; Relay signs every action callback POST with an HMAC-SHA256 header so the developer's backend can verify the request actually came from Relay, not a spoofed caller.

6. **Dashboard snapshots on notification.** When a Pro notification fires, Relay captures a screenshot of the dashboard at that moment and attaches it as a rich preview image in the notification — the user sees the actual state of their system without opening anything.

7. **Team sharing.** Pro users can share dashboards with teammates — each team member sees the same dashboards and receives notifications on their own devices, useful for on-call rotations or shared agent monitoring.

8. **Notification analytics dashboard.** Pro users get a web dashboard showing notification volume over time, channel breakdown, action tap rates, average time-to-action, and delivery success rates — gives visibility into how their alert system is actually performing.

## Which Three I'd Build First

1. **Webhook delivery logs with replay** — highest signal, easiest to build (just expose the existing notification + push_tickets data in a new UI), and the feature most likely to make a free user think "I need that."
2. **HMAC request signing** — small engineering effort, disproportionate trust signal for security-conscious developers. Differentiates from ntfy/Pushover.
3. **Team sharing** — unlocks the multiplier: one developer adopts Relay, invites their team, each seat is $7.99/mo. This is the revenue growth lever.

CONFIDENCE: 0.80
