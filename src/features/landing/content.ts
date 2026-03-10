import { FREE_LIMITS, PRO_LIMITS } from "@shared/product";

export const INTEGRATIONS = {
  node: {
    name: "Node.js",
    code: `import { Relay } from '@relayapp/sdk'

const relay = new Relay({ token: process.env.RELAY_TOKEN })
await relay.notify({
  title: 'Build complete',
  body: 'All tests passed'
})`,
  },
  bash: {
    name: "Bash",
    code: `curl -X POST https://relayapp.dev/webhook \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "YOUR_WEBHOOK_TOKEN",
    "title": "Build completed",
    "body": "All tests passed"
  }'`,
  },
  github: {
    name: "GitHub Actions",
    code: `- name: Send Relay Notification
  run: |
    curl -X POST https://relayapp.dev/webhook \\
      -H "Content-Type: application/json" \\
      -d '{
        "token": "\${{ secrets.RELAY_TOKEN }}",
        "title": "Action Failed",
        "body": "Workflow \${{ github.workflow }} failed"
      }'`,
  },
  python: {
    name: "Python",
    code: `import requests

requests.post("https://relayapp.dev/webhook", json={
    "token": "YOUR_WEBHOOK_TOKEN",
    "title": "Model trained",
    "body": "Accuracy: 98.5%"
})`,
  },
} as const;

export const FAQ_ITEMS = [
  {
    q: "What is Relay?",
    a: "Relay is a mobile runtime for the tools you build. Wrap any URL in a native shell, trigger push notifications with our SDK, and deep link straight into the exact screen when something happens.",
  },
  {
    q: "Do my dashboards need to be public?",
    a: "No. Most users access dashboards through Tailscale or another private network. Relay simply loads the URL you provide. Your dashboards stay on your own infrastructure.",
  },
  {
    q: "Does Relay host my dashboards?",
    a: "No. Relay simply loads your existing dashboards in a mobile interface and sends notifications. Your data and dashboards remain wherever you host them.",
  },
  {
    q: "Do I need to store images for notification icons?",
    a: "No. Relay supports icon_url, so images can be hosted anywhere: your own server, a CDN, or any public URL.",
  },
  {
    q: "Does Relay replace my dashboard?",
    a: "No. Relay runs your existing dashboard inside a managed mobile wrapper. You keep hosting and building your UI; Relay handles push, auth, and the native experience.",
  },
  {
    q: "What kinds of systems work with Relay?",
    a: "Anything that can send a webhook: AI agents, automation tools, CI pipelines, servers, scripts, monitoring systems, trading bots, and more. If it can make an HTTP POST request, it works with Relay.",
  },
  {
    q: "How do push notifications work?",
    a: "Each dashboard you save gets a unique webhook token. Send a simple HTTP POST request with a title and body to our endpoint, and Relay delivers an instant push notification to your phone. Tap the notification to open the associated dashboard.",
  },
  {
    q: "Is there a free plan?",
    a: `Yes. The free plan includes ${FREE_LIMITS.dashboards} dashboards, ${FREE_LIMITS.devices} device, and ${FREE_LIMITS.notificationsPerMonth} notifications per month. Upgrade to Pro for unlimited dashboards, up to ${PRO_LIMITS.devices} devices, and ${PRO_LIMITS.notificationsPerMonth.toLocaleString()} notifications/month.`,
  },
  {
    q: "Do I need to use the SDK?",
    a: "The @relayapp/sdk makes integration a one-liner, but you can also use our REST API directly with a simple curl POST if you prefer. Both work the same way.",
  },
] as const;
