# Relay Landing Page Copy v2: Vibe-Coder Positioning

- **RESULT:** Updated landing page copy focused on developers, AI agent builders, and vibe-coders.

## 1. Hero Section
- **Headline:** The mobile runtime for<br />tools you build with AI.
- **Subheadline:** Bridge the gap between your custom dashboards and your phone. Add push notifications, mobile wrapping, and secure auth to your vibe-coded tools in 60 seconds.
- **CTA Button:** Get Started Free
- **Secondary CTA:** View Documentation

## 2. Features Section
- **Section Title:** Everything your personal tool needs.
- **Feature 1: Push Notifications via SDK**
  - Stop polling your own terminals. Use our lightweight SDK to trigger instant mobile alerts when your agents finish a task or your trading bot executes a move.
- **Feature 2: Native Mobile Runtime**
  - Don't waste time on Swift or Kotlin. Relay wraps your web-based dashboards in a high-performance native shell with support for haptics and deep-linking.
- **Feature 3: Auth-as-a-Header**
  - Skip the complex OAuth setup. Relay handles the mobile login and injects secure identity headers into your webview requests, so your backend always knows it's you.
- **Feature 4: Interactive Webhooks**
  - Add action buttons to your notifications. Approve a deployment or kill a runaway agent directly from your lock screen with a single tap.

## 3. How It Works
- **Section Title:** From idea to mobile app in minutes.
- **Step 1: Point to your URL**
  - Provide the URL of your dashboard—whether it's a local tunnel, a Vercel deploy, or a self-hosted instance.
- **Step 2: Drop in the SDK**
  - Install `@relayapp/sdk` and add three lines of code to start triggering notifications from your backend or frontend.
- **Step 3: Get the App**
  - Open the Relay mobile app to see your tool wrapped in a native interface with all your notifications synced.

## 4. Code/Demo Section
- **Headline:** Integrate in seconds.
- **Code Snippet:**
```typescript
import { Relay } from '@relayapp/sdk'

const relay = new Relay({ 
  token: process.env.RELAY_TOKEN 
})

// Trigger a notification
await relay.notify({ 
  title: 'Agent task complete', 
  body: 'Obelisk finished the codebase audit.',
  actions: [{ title: 'View Report', url: '/reports/123' }]
})
```

## 5. Who It's For
- **The Vibe-Coder**
  - You’re building a custom dashboard with Claude and Cursor and need it on your phone without the App Store headache.
- **The AI Agent Builder**
  - You’re running autonomous agents and need a reliable way to get an "approve" signal while you’re away from your desk.
- **The Home Automator**
  - You’ve built a custom Home Assistant panel or a private monitoring tool and want it to feel like a first-class citizen on iOS or Android.

## 6. Pricing Section
- **Headline:** Built for builders.
- **Free Plan:**
  - 1 Active Project
  - 500 notifications / month
  - Basic Webhook access
  - Community support
- **Pro Plan:**
  - Unlimited Projects
  - 10,000 notifications / month
  - Interactive Action Buttons
  - Bridge JS SDK Access
  - Priority support

## 7. Final CTA Section
- **Headline:** Ready to ship your mobile tool?
- **Subheadline:** Join the wave of developers building their own infra. Create a free account and get your first notification today.
- **Button Text:** Get Started Free

---
**CONFIDENCE:** 0.95
