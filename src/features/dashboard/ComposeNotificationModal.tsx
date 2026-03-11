import { useState } from "react";
import { AlertCircle, Check, Send } from "lucide-react";

import { supabase } from "../../lib/supabase";
import type { DashboardWithSharing as Dashboard } from "./types";
import { sendDashboardNotification } from "./utils";

interface ComposeNotificationModalProps {
  dashboards: Dashboard[];
  onClose: () => void;
}

type Severity = "info" | "warning" | "critical";
type Status = "idle" | "sending" | "success" | "error";

export function ComposeNotificationModal({
  dashboards,
  onClose,
}: ComposeNotificationModalProps) {
  const [selectedDashboardId, setSelectedDashboardId] = useState(
    dashboards[0]?.id ?? ""
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<Severity>("info");
  const [channel, setChannel] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedDashboard = dashboards.find((d) => d.id === selectedDashboardId);

  const handleSend = async () => {
    if (!selectedDashboard || !title.trim()) return;

    setStatus("sending");
    setErrorMessage("");

    try {
      const payload: Record<string, unknown> = {
        appId: selectedDashboard.id,
        title: title.trim(),
      };
      if (body.trim()) payload.body = body.trim();
      if (severity !== "info") payload.severity = severity;
      if (channel.trim()) payload.channel = channel.trim();
      if (url.trim()) payload.url = url.trim();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      await sendDashboardNotification(session.access_token, payload);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to send notification"
      );
    }
  };

  const handleSendAnother = () => {
    setTitle("");
    setBody("");
    setSeverity("info");
    setChannel("");
    setUrl("");
    setStatus("idle");
    setErrorMessage("");
  };

  if (status === "success") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Notification sent!</h2>
            <p className="text-sm text-text-muted mb-6">
              Your notification was delivered to {selectedDashboard?.name}.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleSendAnother}
                className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-blue-600 transition-all cursor-pointer"
              >
                Send another
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-main transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Compose Notification</h2>
        </div>
        <div className="p-6 space-y-4">
          {status === "error" && errorMessage ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          ) : null}

          {dashboards.length > 1 ? (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">
                Dashboard
              </label>
              <select
                value={selectedDashboardId}
                onChange={(e) => setSelectedDashboardId(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
              >
                {dashboards.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-text-muted">
                Title <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-text-muted">
                {title.length}/200
              </span>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              placeholder="e.g. Deploy completed"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-text-muted">
                Body
              </label>
              <span className="text-xs text-text-muted">
                {body.length}/2000
              </span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 2000))}
              placeholder="Optional message body"
              rows={3}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">
                Channel
              </label>
              <input
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder="e.g. trades"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">
              URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/dashboard/trades"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-main transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!title.trim() || !selectedDashboard || status === "sending"}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-blue-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "sending" ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
