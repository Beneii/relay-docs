import { useState } from "react";
import { AlertCircle, Check, ChevronDown, Copy, ExternalLink, Plus, Send, Trash2, Webhook, Zap } from "lucide-react";

import type { Dashboard, DashboardTestResult } from "./types";

interface DashboardListSectionProps {
  copiedToken: string | null;
  dashboards: Dashboard[];
  deleteDashboardError: string | null;
  deletingDashboardId: string | null;
  onCopyToken: (token: string) => Promise<void>;
  onDeleteDashboard: (id: string) => Promise<void>;
  onShowAddModal: () => void;
  onShowComposeModal: () => void;
  onTestWebhook: (dashboard: Dashboard) => Promise<void>;
  testResult: DashboardTestResult | null;
  testingId: string | null;
}

const WEBHOOK_BASE = 'https://relayapp.dev/webhook';

function DashboardCard({
  dashboard,
  copiedToken,
  deletingDashboardId,
  testResult,
  testingId,
  onCopyToken,
  onDeleteDashboard,
  onTestWebhook,
}: {
  dashboard: Dashboard;
  copiedToken: string | null;
  deletingDashboardId: string | null;
  testResult: DashboardTestResult | null;
  testingId: string | null;
  onCopyToken: (token: string) => Promise<void>;
  onDeleteDashboard: (id: string) => Promise<void>;
  onTestWebhook: (dashboard: Dashboard) => Promise<void>;
}) {
  const [showQuickstart, setShowQuickstart] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<'curl' | 'sdk' | null>(null);
  const webhookUrl = `${WEBHOOK_BASE}/${dashboard.webhook_token}`;

  const curlSnippet = `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Hello from Relay"}'`;

  const sdkSnippet = `import { Relay } from '@relayapp/sdk'
const relay = new Relay({ token: '${dashboard.webhook_token}' })
await relay.notify({ title: 'Hello from Relay' })`;

  async function copySnippet(type: 'curl' | 'sdk', text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedSnippet(type);
    setTimeout(() => setCopiedSnippet(null), 2000);
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-lg mb-1">{dashboard.name}</h3>
          <a
            href={dashboard.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-accent hover:underline mb-3 inline-flex items-center gap-1"
          >
            {dashboard.url}
            <ExternalLink className="w-3 h-3" />
          </a>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <code className="text-xs text-text-muted font-mono bg-bg px-2.5 py-1.5 rounded-lg border border-border truncate max-w-[240px]">
              {dashboard.webhook_token}
            </code>
            <button
              onClick={() => onCopyToken(dashboard.webhook_token)}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-main transition-colors cursor-pointer shrink-0"
            >
              {copiedToken === dashboard.webhook_token ? (
                <><Check className="w-3.5 h-3.5 text-accent" /> Copied</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Copy token</>
              )}
            </button>
            <button
              onClick={() => onTestWebhook(dashboard)}
              disabled={testingId === dashboard.id}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border bg-bg text-xs text-text-muted hover:text-text-main hover:bg-surface-hover transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testingId === dashboard.id ? (
                <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Testing</>
              ) : testResult?.id === dashboard.id && testResult.status === "success" ? (
                <><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-500">Sent!</span></>
              ) : testResult?.id === dashboard.id && testResult.status === "error" ? (
                <><Zap className="w-3.5 h-3.5 text-red-500" /><span className="text-red-500">Failed</span></>
              ) : (
                <><Zap className="w-3.5 h-3.5" /> Test</>
              )}
            </button>
          </div>

          {/* Webhook URL row */}
          <div className="flex items-center gap-2 mt-2">
            <code className="text-xs text-text-muted font-mono bg-bg px-2.5 py-1.5 rounded-lg border border-border truncate max-w-[360px]">
              POST {webhookUrl}
            </code>
            <button
              onClick={() => onCopyToken(webhookUrl)}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-main transition-colors cursor-pointer shrink-0"
            >
              {copiedToken === webhookUrl ? (
                <><Check className="w-3.5 h-3.5 text-accent" /> Copied</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Copy URL</>
              )}
            </button>
            <button
              onClick={() => setShowQuickstart((v) => !v)}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-main transition-colors cursor-pointer shrink-0"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showQuickstart ? 'rotate-180' : ''}`} />
              Quick start
            </button>
          </div>

          {showQuickstart && (
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wide">curl</span>
                  <button onClick={() => copySnippet('curl', curlSnippet)} className="text-xs text-text-muted hover:text-text-main transition-colors cursor-pointer">
                    {copiedSnippet === 'curl' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="bg-bg border border-border rounded-xl p-3 text-xs font-mono text-text-main overflow-x-auto whitespace-pre">{curlSnippet}</pre>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wide">SDK</span>
                  <button onClick={() => copySnippet('sdk', sdkSnippet)} className="text-xs text-text-muted hover:text-text-main transition-colors cursor-pointer">
                    {copiedSnippet === 'sdk' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="bg-bg border border-border rounded-xl p-3 text-xs font-mono text-text-main overflow-x-auto whitespace-pre">{sdkSnippet}</pre>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => onDeleteDashboard(dashboard.id)}
          disabled={deletingDashboardId === dashboard.id}
          className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all self-start cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deletingDashboardId === dashboard.id ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}

export function DashboardListSection({
  copiedToken,
  dashboards,
  deleteDashboardError,
  deletingDashboardId,
  onCopyToken,
  onDeleteDashboard,
  onShowAddModal,
  onShowComposeModal,
  onTestWebhook,
  testResult,
  testingId,
}: DashboardListSectionProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Your Dashboards</h1>
        <div className="flex items-center gap-2">
          {dashboards.length > 0 ? (
            <button
              onClick={onShowComposeModal}
              className="flex items-center gap-2 h-10 px-4 rounded-lg border border-border text-sm font-medium text-text-muted hover:text-text-main hover:bg-surface-hover transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Compose
            </button>
          ) : null}
          <button
            onClick={onShowAddModal}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-emerald-600 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Dashboard
          </button>
        </div>
      </div>

      {deleteDashboardError ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{deleteDashboardError}</p>
        </div>
      ) : null}

      {dashboards.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-2xl p-12 text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
            <Webhook className="w-7 h-7 text-accent" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Add your first app</h3>
          <p className="text-text-muted mb-8 text-sm max-w-md mx-auto leading-relaxed">
            Relay saves your dashboards and tools, gives each one a webhook URL, and
            sends push notifications when something important happens.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 text-left mb-8">
            <div className="rounded-xl border border-border bg-bg p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-1">
                1
              </p>
              <p className="text-sm font-medium mb-1">Add a dashboard</p>
              <p className="text-xs text-text-muted">
                Save any internal tool, monitoring view, or web app you want to launch
                quickly.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-bg p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-1">
                2
              </p>
              <p className="text-sm font-medium mb-1">Copy the webhook</p>
              <p className="text-xs text-text-muted">
                Each app gets its own webhook URL so you can trigger alerts from scripts
                and automations.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-bg p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-1">
                3
              </p>
              <p className="text-sm font-medium mb-1">Receive notifications</p>
              <p className="text-xs text-text-muted">
                Tap the push to jump straight into the exact dashboard that needs your
                attention.
              </p>
            </div>
          </div>
          <button
            onClick={onShowAddModal}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-emerald-600 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add your first app
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {dashboards.map((dashboard) => (
            <DashboardCard
              key={dashboard.id}
              dashboard={dashboard}
              copiedToken={copiedToken}
              deletingDashboardId={deletingDashboardId}
              testResult={testResult}
              testingId={testingId}
              onCopyToken={onCopyToken}
              onDeleteDashboard={onDeleteDashboard}
              onTestWebhook={onTestWebhook}
            />
          ))}
        </div>
      )}
    </>
  );
}
