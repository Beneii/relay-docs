import { FREE_LIMITS, PRO_LIMITS } from "@shared/product";

export const INTEGRATIONS = {
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
  node: {
    name: "Node.js",
    code: `fetch("https://relayapp.dev/webhook", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    token: "YOUR_WEBHOOK_TOKEN",
    title: "Server Error",
    body: "Database connection lost"
  })
});`,
  },
} as const;

export const FAQ_ITEMS = [
  {
    q: "What is Relay?",
    a: "Relay is a mobile command center for web dashboards. Save any web dashboard as a native app on your phone, send webhooks to receive push notifications, and tap to open your dashboards instantly. It is commonly used to monitor AI agents, automations, servers, and self-hosted systems.",
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
    a: "No. Relay is a mobile companion for dashboards and automation systems. It gives you a native app wrapper and push notifications on top of your existing setup.",
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
    q: "Do I need to install an SDK?",
    a: "No. Relay uses a simple REST API. Just send an HTTP POST request from any language, script, or CI/CD pipeline. No SDKs, no dependencies.",
  },
] as const;
