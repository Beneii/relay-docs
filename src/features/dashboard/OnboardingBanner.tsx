import { useMemo, useState } from "react";
import { Clipboard, PlusCircle } from "lucide-react";

import type { DashboardWithSharing as Dashboard } from "./types";

function usePersistentDismissed(key: string) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(key) === "1";
  });

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(key, "1");
    } catch {
      // ignore storage errors
    }
  };

  return { dismissed, dismiss };
}

interface OnboardingBannerProps {
  dashboards: Dashboard[];
  notificationsUsed: number;
  onAddDashboard: () => void;
  onTestWebhook: (dashboard: Dashboard) => void;
}

export function OnboardingBanner({
  dashboards,
  notificationsUsed,
  onAddDashboard,
  onTestWebhook,
}: OnboardingBannerProps) {
  const { dismissed, dismiss } = usePersistentDismissed("relay_onboarding_dismissed");
  const showBanner = !dismissed && (dashboards.length === 0 || notificationsUsed === 0);

  const firstDashboard = dashboards[0];

  const tokenSnippet = useMemo(() => {
    const token = firstDashboard?.webhook_token ?? "YOUR_WEBHOOK_TOKEN";
    return `import { Relay } from '@relayapp/sdk'\n\nconst relay = new Relay({ token: '${token}' })\n\nawait relay.notify({\n  title: 'Hello from Relay',\n  body: 'Your webhook is alive.',\n})`;
  }, [firstDashboard]);

  if (!showBanner) return null;

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(tokenSnippet);
    } catch {
      // ignore
    }
  };

  const handleTest = () => {
    if (firstDashboard) {
      onTestWebhook(firstDashboard);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-[0.3em] uppercase text-accent mb-1">
              Getting Started
            </p>
            <h3 className="text-2xl font-bold">Launch your first dashboard in three steps</h3>
          </div>
          <button
            onClick={dismiss}
            className="text-sm text-text-muted hover:text-text-main transition-colors self-start md:self-auto cursor-pointer"
          >
            Dismiss
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-border rounded-xl p-4 bg-bg">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Step 1</p>
            <h4 className="text-base font-semibold mb-2">Add your dashboard</h4>
            <p className="text-sm text-text-muted mb-3">
              Enter any URL you want to access from Relay—local tunnel, self-hosted UI, or Vercel deploy.
            </p>
            <button
              onClick={onAddDashboard}
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-emerald-600 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Add dashboard
            </button>
          </div>

          <div className="border border-border rounded-xl p-4 bg-bg">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Step 2</p>
            <h4 className="text-base font-semibold mb-2">Copy your token</h4>
            <p className="text-sm text-text-muted mb-3">
              Drop this snippet into your backend or agent script to trigger a notification.
            </p>
            <div className="relative bg-surface border border-border rounded-lg p-3 font-mono text-xs text-text-muted leading-relaxed max-h-40 overflow-y-auto">
              <button
                onClick={handleCopySnippet}
                className="absolute top-2 right-2 text-text-muted hover:text-text-main transition-colors cursor-pointer"
                aria-label="Copy code"
              >
                <Clipboard className="w-4 h-4" />
              </button>
              <pre>
                <code>{tokenSnippet}</code>
              </pre>
            </div>
          </div>

          <div className="border border-border rounded-xl p-4 bg-bg">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Step 3</p>
            <h4 className="text-base font-semibold mb-2">Send a test notification</h4>
            <p className="text-sm text-text-muted mb-3">
              We&apos;ll hit your webhook token and show the alert on your phone instantly.
            </p>
            <button
              onClick={handleTest}
              disabled={!firstDashboard}
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-accent text-white font-medium text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send test
            </button>
            {!firstDashboard ? (
              <p className="text-xs text-text-muted mt-2">Add a dashboard to enable this step.</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
