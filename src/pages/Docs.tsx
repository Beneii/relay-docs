import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clipboard, Check, Hash } from 'lucide-react';
import { FREE_LIMITS, PRO_LIMITS, PRO_PRICING } from '@shared/product';
import { LandingFooter } from '../features/landing/LandingFooter';
import { LandingNav } from '../features/landing/LandingNav';
import { useMarketingNav } from '../features/landing/useMarketingNav';

const NAV_ITEMS = [
  { id: 'quickstart', label: 'Quickstart' },
  {
    id: 'sdk-reference',
    label: 'SDK Reference',
    children: [
      { id: 'sdk-relayconfig', label: 'RelayConfig' },
      { id: 'sdk-notifyoptions', label: 'NotifyOptions' },
      { id: 'sdk-relayaction', label: 'RelayAction' },
      { id: 'sdk-severity', label: 'Severity & Channels' },
      { id: 'sdk-notifyresponse', label: 'NotifyResponse' },
    ],
  },
  { id: 'interactive-notifications', label: 'Interactive Notifications' },
  { id: 'relay-manifest', label: 'relay.json Manifest' },
  { id: 'rest-api', label: 'REST API Reference' },
  { id: 'limits', label: 'Limits & Quotas' },
  { id: 'errors', label: 'Error Codes' },
];

interface CodeBlockProps {
  code: string;
  language?: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative bg-bg border border-border rounded-xl p-5 font-mono text-sm text-text-muted leading-relaxed overflow-x-auto">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-3 right-3 text-text-muted hover:text-text-main transition-colors inline-flex items-center gap-1 text-xs font-medium cursor-pointer"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            Copied!
          </>
        ) : (
          <>
            <Clipboard className="w-4 h-4" />
            Copy
          </>
        )}
      </button>
      {language ? (
        <div className="text-[10px] uppercase font-semibold tracking-[0.2em] text-text-muted mb-3">{language}</div>
      ) : null}
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface HeadingProps {
  id: string;
  level?: 2 | 3;
  children: React.ReactNode;
}

function AnchorHeading({ id, level = 2, children }: HeadingProps) {
  const Component = level === 2 ? 'h2' : 'h3';
  const baseClasses =
    level === 2
      ? 'text-3xl md:text-4xl font-bold tracking-tight mb-6'
      : 'text-xl md:text-2xl font-semibold mb-4';

  return (
    <Component id={id} className={`group scroll-mt-28 flex items-center gap-3 ${baseClasses}`}>
      <span>{children}</span>
      <a
        href={`#${id}`}
        className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-main transition-colors cursor-pointer"
        aria-label={`Copy link to ${children}`}
      >
        <Hash className="w-4 h-4" />
      </a>
    </Component>
  );
}

function FieldTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-border text-sm text-left border-collapse">
        <thead>
          <tr className="bg-surface">
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold border-b border-border text-text-main">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-border last:border-b-0">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-3 align-top text-text-muted">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Docs() {
  const { isSignedIn, mobileMenuOpen, navLogoRotate, setMobileMenuOpen } = useMarketingNav();

  const restRequestFields = useMemo(
    () => [
      ['`token`', '`string`', 'Yes*', 'Webhook token. *Not required if token is in the URL path.'],
      ['`title`', '`string`', 'Yes', 'Notification title. Max 200 chars.'],
      ['`body`', '`string`', 'No', 'Notification body. Max 2,000 chars.'],
      ['`url`', '`string`', 'No', 'Deep link path. Max 2,048 chars.'],
      ['`severity`', '`string`', 'No', '`"info"`, `"warning"`, or `"critical"`. Default: `"info"`.'],
      ['`channel`', '`string`', 'No', 'Channel slug. Max 32 chars.'],
      ['`actions`', '`array`', 'No', 'Action buttons. Max 5. Each: `{ label, url, style? }`.'],
      ['`eventType`', '`string`', 'No', 'Custom event label.'],
      ['`metadata`', '`object`', 'No', 'Arbitrary JSON. Max 4 KB, max depth 5.'],
    ],
    []
  );

  const errorRows = [
    ['`400`', '"Invalid JSON payload"', 'Request body is not valid JSON.', 'Check your JSON syntax.'],
    ['`400`', '"title is required"', 'Missing or empty `title` field.', 'Include a non-empty `title` string.'],
    ['`400`', '"body must be a string"', '`body` field is not a string.', 'Pass `body` as a string or omit it.'],
    ['`400`', '"severity must be one of info, warning, or critical"', 'Invalid severity value.', 'Use `"info"`, `"warning"`, or `"critical"`.'],
    ['`400`', '"channel must contain alphanumeric characters"', 'Channel is empty after slugification.', 'Use letters, numbers, and hyphens.'],
    ['`400`', '"actions must include between 1 and 5 entries"', 'Actions array is empty or too long.', 'Provide 1-5 action objects.'],
    ['`400`', '"action url at index N must be a valid https URL"', 'Action URL is not HTTPS.', 'All action URLs must use `https://`.'],
    ['`400`', '"action labels must be unique"', 'Duplicate action labels (case-insensitive).', 'Use distinct labels for each action.'],
    ['`400`', '"metadata exceeds 4KB size limit"', 'Metadata JSON is too large.', 'Reduce metadata payload size.'],
    ['`400`', '"url exceeds 2048 characters"', 'Deep link URL is too long.', 'Shorten the URL path.'],
    ['`401`', '"Missing \'token\' field (webhook token)"', 'No token in body or URL path, or token is too short.', 'Include your 64-char hex token.'],
    ['`401`', '"Invalid webhook token"', "Token doesn't match any dashboard.", 'Check the token on your dashboard.'],
    ['`403`', '"Notifications disabled for this app"', 'Dashboard has notifications turned off.', 'Enable notifications in dashboard settings.'],
    ['`405`', '"Method not allowed"', 'Not a POST request.', 'Use POST method.'],
    ['`413`', '"Payload too large"', 'Request body exceeds 10 KB.', 'Reduce payload size.'],
    ['`429`', '"Rate limit exceeded"', 'More than 60 requests/minute from this IP.', 'Wait 60 seconds and retry.'],
    ['`429`', '"Monthly notification limit exceeded"', "Hit your plan's monthly quota.", 'Upgrade to Pro or wait for next cycle.'],
    ['`429`', '"Free plan app limit exceeded"', 'More dashboards than the free plan allows.', 'Remove a dashboard or upgrade.'],
    ['`500`', '"Internal server error"', 'Unexpected server failure.', 'Retry the request. Contact support if persistent.'],
  ];

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans">
      <LandingNav
        anchorBasePath="/"
        isSignedIn={isSignedIn}
        mobileMenuOpen={mobileMenuOpen}
        navLogoRotate={navLogoRotate}
        onToggleMobileMenu={() => setMobileMenuOpen((isOpen) => !isOpen)}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-sm font-semibold tracking-[0.3em] text-accent uppercase mb-4">
            Docs
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Relay Developer Guide</h1>
          <p className="text-lg text-text-muted">
            Everything you need to integrate push notifications, interactive actions, and the Relay mobile runtime into your vibe-coded tools.
          </p>
        </div>

        {/* Mobile nav */}
        <div className="lg:hidden mb-10 overflow-x-auto hide-scrollbar">
          <div className="flex gap-3 min-w-max">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="px-4 py-2 rounded-full border border-border text-sm font-medium text-text-muted hover:text-text-main cursor-pointer"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] gap-10">
          <aside className="hidden lg:block sticky top-28 h-fit">
            <nav className="space-y-4 text-sm">
              {NAV_ITEMS.map((item) => (
                <div key={item.id}>
                  <a href={`#${item.id}`} className="font-semibold text-text-muted hover:text-text-main transition-colors">
                    {item.label}
                  </a>
                  {item.children ? (
                    <div className="mt-2 ml-4 space-y-2">
                      {item.children.map((child) => (
                        <a
                          key={child.id}
                          href={`#${child.id}`}
                          className="block text-text-muted hover:text-text-main"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </nav>
          </aside>

          <div className="space-y-24">
            {/* Quickstart */}
            <section id="quickstart">
              <AnchorHeading id="quickstart">Get started in 60 seconds</AnchorHeading>
              <div className="border border-accent/20 bg-accent/5 rounded-2xl p-4 text-sm text-text-muted mb-6">
                The SDK will be available on npm soon. Until it lands, you can follow the same steps locally or use the REST API directly.
              </div>
              <div className="space-y-8">
                <div>
                  <p className="font-semibold mb-2 text-text-main">Step 1: Install</p>
                  <CodeBlock code={`npm install @relayapp/sdk`} language="bash" />
                </div>
                <div>
                  <p className="font-semibold mb-2 text-text-main">Step 2: Initialize</p>
                  <CodeBlock
                    language="typescript"
                    code={`import { Relay } from '@relayapp/sdk'

const relay = new Relay({
  token: process.env.RELAY_TOKEN  // 64-char hex token from your dashboard
})`}
                  />
                </div>
                <div>
                  <p className="font-semibold mb-2 text-text-main">Step 3: Send a notification</p>
                  <CodeBlock
                    language="typescript"
                    code={`await relay.notify({
  title: 'Build complete',
  body: 'All 47 tests passed.',
})`}
                  />
                </div>
              </div>
              <div className="mt-6 border border-border rounded-xl p-4 bg-surface/50 text-sm text-text-muted">
                Your webhook token is on your{' '}
                <Link to="/dashboard" className="text-accent font-medium hover:underline">
                  dashboard
                </Link>
                . Each saved dashboard gets a unique token. The token is a 64-character hex string.
              </div>
            </section>

            {/* SDK Reference */}
            <section id="sdk-reference">
              <AnchorHeading id="sdk-reference">SDK Reference</AnchorHeading>

              <AnchorHeading id="sdk-relayconfig" level={3}>
                RelayConfig
              </AnchorHeading>
              <FieldTable
                columns={['Field', 'Type', 'Required', 'Description']}
                rows={[
                  ['`token`', '`string`', 'Yes', '64-character hex webhook token from your dashboard.'],
                  ['`endpoint`', '`string`', 'No', 'Override the API endpoint. Defaults to `https://relayapp.dev/webhook`.'],
                ]}
              />

              <AnchorHeading id="sdk-notifyoptions" level={3}>
                NotifyOptions
              </AnchorHeading>
              <FieldTable
                columns={['Field', 'Type', 'Required', 'Description', 'Constraints']}
                rows={[
                  ['`title`', '`string`', 'Yes', 'Notification title shown on the device.', 'Max 200 chars. Trimmed.'],
                  ['`body`', '`string`', 'No', 'Notification body text.', 'Max 2,000 chars.'],
                  ['`url`', '`string`', 'No', 'Deep link path within your dashboard.', 'Max 2,048 chars. Relative path (e.g. `"/trades/latest"`).'],
                  ['`severity`', '`"info" | "warning" | "critical"`', 'No', 'Notification priority level.', 'Default `"info"`. See Severity Levels.'],
                  ['`channel`', '`string`', 'No', 'Logical group for notification management.', 'Max 32 chars. Lowercase alphanumeric + hyphens.'],
                  ['`actions`', '`RelayAction[]`', 'No', 'Action buttons shown on the notification.', 'Max 5 actions. See RelayAction.'],
                  ['`eventType`', '`string`', 'No', 'Custom event label for filtering and analytics.', 'Stored as-is.'],
                  ['`metadata`', '`Record<string, unknown>`', 'No', 'Arbitrary JSON metadata attached to the notification.', 'Max 4 KB. Max nesting depth: 5.'],
                ]}
              />

              <AnchorHeading id="sdk-relayaction" level={3}>
                RelayAction
              </AnchorHeading>
              <FieldTable
                columns={['Field', 'Type', 'Required', 'Description', 'Constraints']}
                rows={[
                  ['`label`', '`string`', 'Yes', 'Button text shown on the notification.', 'Max 50 chars. Unique per notification (case-insensitive).'],
                  ['`url`', '`string`', 'Yes', 'HTTPS URL that Relay POSTs to when the user taps this action.', 'Must be a valid `https://` URL.'],
                  ['`style`', '`"default" | "destructive"`', 'No', 'Visual hint. `"destructive"` renders red on iOS.', 'Default `"default"`.'],
                ]}
              />
              <p className="text-sm text-text-muted mt-4 mb-3">Action callback POST payload:</p>
              <CodeBlock
                language="json"
                code={`{
  "notificationId": "uuid-of-the-notification",
  "actionLabel": "Approve",
  "actionIndex": 0
}`}
              />

              <AnchorHeading id="sdk-severity" level={3}>
                Severity & Channels
              </AnchorHeading>
              <FieldTable
                columns={['Level', 'Behavior']}
                rows={[
                  ['`"info"`', 'Default sound. Standard notification display.'],
                  ['`"warning"`', 'Default sound. High-importance Android channel. iOS time-sensitive delivery.'],
                  ['`"critical"`', 'Alert sound. Maximum priority Android channel. iOS critical alert (if entitlement granted).'],
                ]}
              />
              <CodeBlock
                language="typescript"
                code={`await relay.notify({
  title: 'Stop loss triggered',
  body: 'BTC position closed at $42,100',
  severity: 'critical',
  channel: 'trading',
})`}
              />

              <AnchorHeading id="sdk-notifyresponse" level={3}>
                NotifyResponse
              </AnchorHeading>
              <FieldTable
                columns={['Field', 'Type', 'Description']}
                rows={[
                  ['`success`', '`boolean`', 'Always `true` on 200 responses.'],
                  ['`notificationId`', '`string`', 'UUID of the stored notification. Use it for debugging or analytics.'],
                  ['`pushed`', '`number`', 'Number of devices Relay attempted to send push notifications to.'],
                ]}
              />
            </section>

            {/* Interactive notifications */}
            <section id="interactive-notifications">
              <AnchorHeading id="interactive-notifications">Interactive Notifications</AnchorHeading>
              <p className="text-text-muted mb-6">
                Add approval buttons or destructive actions directly to a push notification. Relay POSTs to the action URLs when users tap an action.
              </p>
              <CodeBlock
                language="typescript"
                code={`await relay.notify({
  title: 'Deploy ready for approval',
  body: 'Agent Obelisk promoted v1.4.0 to staging.',
  actions: [
    {
      label: 'Approve',
      url: 'https://api.yourapp.com/deployments/123/approve',
    },
    {
      label: 'Reject',
      url: 'https://api.yourapp.com/deployments/123/reject',
      style: 'destructive',
    },
  ],
})`}
              />
              <CodeBlock
                language="typescript"
                code={`await relay.notify({
  title: 'Trade executed',
  body: 'Bought 0.5 ETH at $3,200',
  channel: 'trades',
  url: '/trades/latest',
  actions: [
    { label: 'View Trade', url: 'https://api.yourbot.com/trades/789/details' },
    { label: 'Cancel All', url: 'https://api.yourbot.com/trades/cancel-all', style: 'destructive' },
  ],
})`}
              />
              <div className="mt-6 border border-accent/20 bg-accent/5 rounded-xl p-4 text-sm text-text-muted">
                Action URLs must use HTTPS. Labels must be unique within a single notification. Maximum 5 actions per notification.
              </div>
            </section>

            {/* Manifest */}
            <section id="relay-manifest">
              <AnchorHeading id="relay-manifest">Auto-configure your dashboard in Relay</AnchorHeading>
              <p className="text-text-muted mb-6">
                Drop a <code className="font-mono text-xs bg-surface px-2 py-1 rounded border border-border">relay.json</code> file in your project root. When someone adds your dashboard URL, Relay fetches the manifest and auto-fills the name, icon, theme, and tabs.
              </p>
              <CodeBlock
                language="json"
                code={`{
  "$schema": "https://relayapp.dev/schema/v1",
  "schema_version": 1,
  "name": "Trading Bot Dashboard",
  "icon": "/icon-192.png",
  "theme_color": "#3B82F6",
  "background_color": "#09090b",
  "notifications": true,
  "default_channel": "alerts",
  "tabs": [
    { "name": "Portfolio", "path": "/" },
    { "name": "Trades", "path": "/trades" },
    { "name": "Settings", "path": "/settings" }
  ]
}`}
              />
              <AnchorHeading id="manifest-fields" level={3}>
                Manifest fields
              </AnchorHeading>
              <FieldTable
                columns={['Field', 'Type', 'Required', 'Description']}
                rows={[
                  ['`name`', '`string`', 'Yes', 'Display name in the Relay app. Max 50 chars.'],
                  ['`description`', '`string`', 'No', 'Short description.'],
                  ['`icon`', '`string`', 'No', 'Relative path (`/icon.png`), HTTPS URL, or data URI.'],
                  ['`theme_color`', '`string`', 'No', 'Hex color used for accent/highlight.'],
                  ['`background_color`', '`string`', 'No', 'Hex color used for loading state.'],
                  ['`notifications`', '`boolean`', 'No', 'Whether this app sends push notifications. Default `true`.'],
                  ['`default_channel`', '`string`', 'No', 'Default notification channel slug.'],
                  ['`webhook_base_url`', '`string`', 'No', 'HTTPS base URL for webhook callbacks.'],
                  ['`tabs`', '`RelayManifestTab[]`', 'No', 'Navigation tabs. Max 5.'],
                  ['`metadata`', '`Record<string, string>`', 'No', 'Arbitrary key-value metadata.'],
                ]}
              />
              <AnchorHeading id="tab-fields" level={3}>
                Tab fields
              </AnchorHeading>
              <FieldTable
                columns={['Field', 'Type', 'Required', 'Description']}
                rows={[
                  ['`name`', '`string`', 'Yes', 'Tab label. Max 20 chars.'],
                  ['`path`', '`string`', 'Yes', 'URL path relative to the dashboard root. Must start with `/`.'],
                  ['`icon`', '`string`', 'No', 'Icon identifier or URL.'],
                  ['`channel`', '`string`', 'No', 'Default notification channel for this tab.'],
                ]}
              />
              <AnchorHeading id="manifest-sdk" level={3}>
                SDK helper
              </AnchorHeading>
              <CodeBlock
                language="typescript"
                code={`import { relayConfig } from '@relayapp/sdk'

const manifest = relayConfig({
  name: 'Agent Dashboard',
  theme_color: '#10B981',
  tabs: [
    { name: 'Status', path: '/status' },
    { name: 'Logs', path: '/logs' },
  ],
})

// Write to relay.json
import { writeFileSync } from 'fs'
writeFileSync('public/relay.json', JSON.stringify(manifest, null, 2))`}
              />
              <div className="mt-6 border border-border rounded-xl p-4 bg-surface/50 text-sm text-text-muted">
                If <code className="font-mono text-xs">relay.json</code> is missing or invalid, Relay falls back to manual entry. Valid fields are applied individually—even a partial manifest works.
              </div>
            </section>

            {/* REST API */}
            <section id="rest-api">
              <AnchorHeading id="rest-api">Use the raw HTTP API from any language</AnchorHeading>
              <p className="text-text-muted mb-6">
                Prefer curl or Python? Send a POST request directly without the SDK.
              </p>
              <p className="font-semibold mb-2 text-text-main">Endpoint</p>
              <CodeBlock code={`POST https://relayapp.dev/webhook/{YOUR_TOKEN}\nContent-Type: application/json`} />
              <p className="text-sm text-text-muted my-4">Or pass the token in the body:</p>
              <CodeBlock
                code={`POST https://relayapp.dev/webhook\nContent-Type: application/json\n\n{\n  "token": "YOUR_TOKEN",\n  "title": "..."\n}`}
              />
              <AnchorHeading id="rest-fields" level={3}>
                Request body fields
              </AnchorHeading>
              <FieldTable columns={['Field', 'Type', 'Required', 'Description']} rows={restRequestFields} />
              <p className="font-semibold mt-8 mb-2 text-text-main">Success response (200)</p>
              <CodeBlock
                language="json"
                code={`{
  "success": true,
  "notificationId": "a1b2c3d4-...",
  "pushed": 2
}`}
              />
              <div className="space-y-6 mt-8">
                <div>
                  <p className="font-semibold mb-2 text-text-main">Bash</p>
                  <CodeBlock
                    language="bash"
                    code={`curl -X POST https://relayapp.dev/webhook/YOUR_TOKEN \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Deploy complete",
    "body": "v2.1.0 is live",
    "severity": "info"
  }'`}
                  />
                </div>
                <div>
                  <p className="font-semibold mb-2 text-text-main">Python</p>
                  <CodeBlock
                    language="python"
                    code={`import requests

requests.post(
    "https://relayapp.dev/webhook/YOUR_TOKEN",
    json={
        "title": "Model trained",
        "body": "Accuracy: 98.5%",
        "actions": [
            {"label": "View Results", "url": "https://api.example.com/results/latest"}
        ],
    },
)`}
                  />
                </div>
                <div>
                  <p className="font-semibold mb-2 text-text-main">GitHub Actions</p>
                  <CodeBlock
                    language="yaml"
                    code={`- name: Notify via Relay
  run: |
    curl -X POST https://relayapp.dev/webhook/\${{ secrets.RELAY_TOKEN }} \\
      -H "Content-Type: application/json" \\
      -d '{"title": "Workflow \${{ github.workflow }} completed"}'`}
                  />
                </div>
              </div>
            </section>

            {/* Limits */}
            <section id="limits">
              <AnchorHeading id="limits">Plan limits</AnchorHeading>
              <FieldTable
                columns={['', 'Free', `Pro (${PRO_PRICING.monthly.label}/mo)`]}
                rows={[
                  ['Dashboards', `${FREE_LIMITS.dashboards}`, 'Unlimited'],
                  ['Devices', `${FREE_LIMITS.devices}`, `${PRO_LIMITS.devices}`],
                  ['Notifications / month', `${FREE_LIMITS.notificationsPerMonth}`, `${PRO_LIMITS.notificationsPerMonth.toLocaleString()}`],
                  ['Notification history', '10 most recent', '50 most recent'],
                  ['Team sharing', 'No', 'Yes'],
                  ['Actions per notification', '5', '5'],
                  ['SDK + REST API access', 'Yes', 'Yes'],
                  ['Interactive actions', 'Yes', 'Yes'],
                ]}
              />
              <AnchorHeading id="rate-limits" level={3}>
                Rate limits
              </AnchorHeading>
              <FieldTable
                columns={['Limit', 'Value']}
                rows={[
                  ['Requests per IP per minute', '60'],
                  ['Max request payload', '10 KB'],
                  ['Max title length', '200 chars'],
                  ['Max body length', '2,000 chars'],
                  ['Max deep link URL', '2,048 chars'],
                  ['Max metadata size', '4 KB'],
                  ['Max metadata nesting depth', '5 levels'],
                  ['Max actions per notification', '5'],
                  ['Max action label length', '50 chars'],
                  ['Max channel name length', '32 chars'],
                ]}
              />
              <AnchorHeading id="token-format" level={3}>
                Token format
              </AnchorHeading>
              <p className="text-text-muted mb-4">
                Webhook tokens are 64-character lowercase hexadecimal strings (32 random bytes). Example:
              </p>
              <CodeBlock
                code={`a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`}
              />
              <p className="text-sm text-text-muted mt-4">
                Each dashboard gets a unique token. Tokens are generated when you add a dashboard and can be copied from your{' '}
                <Link to="/dashboard" className="text-accent font-medium hover:underline">
                  dashboard
                </Link>
                .
              </p>
            </section>

            {/* Errors */}
            <section id="errors">
              <AnchorHeading id="errors">Error responses</AnchorHeading>
              <p className="text-text-muted mb-4">All errors return JSON:</p>
              <CodeBlock
                language="json"
                code={`{
  "error": "Human-readable error message"
}`}
              />
              <FieldTable columns={['Status', 'Error', 'Cause', 'Fix']} rows={errorRows} />
            </section>
          </div>
        </div>
      </main>

      <LandingFooter anchorBasePath="/" />
    </div>
  );
}
