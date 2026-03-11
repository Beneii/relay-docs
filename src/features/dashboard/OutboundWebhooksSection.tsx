import { useState } from "react";
import { AlertCircle, ChevronDown, ExternalLink, Plus, Trash2, Zap } from "lucide-react";

import { supabase } from "../../lib/supabase";

interface OutboundWebhook {
  id: string;
  url: string;
  provider: string;
  enabled: boolean;
  last_triggered_at: string | null;
  last_error: string | null;
  created_at: string;
}

interface OutboundWebhooksSectionProps {
  appId: string;
  isPro: boolean;
}

export function OutboundWebhooksSection({ appId, isPro }: OutboundWebhooksSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [webhooks, setWebhooks] = useState<OutboundWebhook[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [addProvider, setAddProvider] = useState<"custom" | "zapier">("custom");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/outbound-webhooks?appId=${appId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setWebhooks(json.webhooks);
      setLoaded(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }

  function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !loaded && isPro) load();
  }

  async function handleAdd() {
    if (!addUrl.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/outbound-webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ appId, url: addUrl.trim(), provider: addProvider }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add");
      setWebhooks((prev) => [...prev, json.webhook]);
      setAddUrl("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add webhook");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/outbound-webhooks?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to delete");
      }
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete webhook");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleToggle}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-main transition-colors cursor-pointer"
      >
        <Zap className="w-3.5 h-3.5" />
        Automation
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {!isPro ? (
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 text-xs text-text-muted">
              <span className="font-medium text-accent">Pro feature.</span>{" "}
              Outbound webhooks forward every notification to Zapier, n8n, or any custom endpoint.{" "}
              <a href="/pricing" className="text-accent hover:underline">Upgrade to Pro</a>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Loading…
                </div>
              ) : (
                <>
                  {webhooks.length > 0 && (
                    <div className="space-y-2">
                      {webhooks.map((wh) => (
                        <div key={wh.id} className="flex items-start gap-2 bg-bg border border-border rounded-xl p-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-medium text-text-muted uppercase tracking-wide">{wh.provider}</span>
                              {wh.last_triggered_at && (
                                <span className="text-xs text-text-muted">· last triggered {new Date(wh.last_triggered_at).toLocaleDateString()}</span>
                              )}
                            </div>
                            <code className="text-xs font-mono text-text-main truncate block">{wh.url}</code>
                            {wh.last_error && (
                              <p className="text-xs text-red-500 mt-0.5 truncate">{wh.last_error}</p>
                            )}
                          </div>
                          <a href={wh.url} target="_blank" rel="noreferrer" className="p-1 text-text-muted hover:text-text-main transition-colors shrink-0">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDelete(wh.id)}
                            disabled={deletingId === wh.id}
                            className="p-1 text-text-muted hover:text-red-500 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === wh.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <select
                      value={addProvider}
                      onChange={(e) => setAddProvider(e.target.value as "custom" | "zapier")}
                      className="h-8 px-2 rounded-lg border border-border bg-bg text-xs text-text-main shrink-0 cursor-pointer"
                    >
                      <option value="custom">Custom</option>
                      <option value="zapier">Zapier</option>
                    </select>
                    <input
                      type="url"
                      value={addUrl}
                      onChange={(e) => setAddUrl(e.target.value)}
                      placeholder="https://hooks.zapier.com/…"
                      className="flex-1 h-8 px-2.5 rounded-lg border border-border bg-bg text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-accent min-w-0"
                      onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    />
                    <button
                      onClick={handleAdd}
                      disabled={adding || !addUrl.trim()}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {adding ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      Add
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
