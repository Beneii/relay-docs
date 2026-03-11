# Loop 2 Council: Next Highest-Impact Work

## 1. Onboarding flow after signup (reduce churn in first 5 minutes)

Right now a new user signs up and lands on an empty dashboard with no guidance. They see "Add Dashboard" but don't know what to do next — they haven't installed the SDK, don't understand webhook tokens, and have no mental model of how the pieces connect. The majority of free-tier churn happens here: users sign up, stare at a blank screen, and leave. Build a 3-step inline onboarding: (1) "Add your first dashboard" with a URL input and explanation, (2) "Copy your webhook token" with a live code snippet showing `npm install @relayapp/sdk` + the notify call pre-filled with their actual token, (3) "Send a test notification" button that fires a test webhook and shows the result in real-time. This turns a confused visitor into someone who's seen the product work in under 2 minutes. No feature in the backlog has a higher impact on activation rate.

## 2. Publish @relayapp/sdk to npm

This is still undone and it's still the single biggest gap between what the product claims and what a user can actually do. The landing page says `npm install @relayapp/sdk`. The docs page walks through SDK usage. The onboarding flow (item 1) will show SDK code with the user's token. But running `npm install @relayapp/sdk` returns "package not found." Every touchpoint in the product funnels toward an npm install that doesn't work. This isn't a feature — it's a broken promise that undermines every other investment. The package builds, the code is written, the types are correct. This is a `npm publish` command behind an npm account setup. Do it before anything else ships.

## 3. Heartbeat monitoring (dead-man's switch)

This is the strongest free-to-paid conversion feature in the backlog. The pitch: "Tell Relay to expect a ping from your agent every N minutes. If the ping stops, Relay sends you a critical notification." Every AI agent builder and cron job operator has experienced the silent failure — a job stops running and nobody notices for hours. Heartbeat monitoring is the feature that makes Relay not just a notification pipe but an active monitoring system. It's also the feature most likely to make a free user hit the 500 notification limit (heartbeat pings count toward quota), which is the natural upgrade trigger. Implementation: add a `heartbeat_interval_minutes` column to the `apps` table, a Supabase cron job (pg_cron or scheduled edge function) that checks for apps whose last notification is older than their interval, and fire a critical notification when the check fails. Moderate effort, high retention impact, natural upsell mechanics.

CONFIDENCE: 0.86
