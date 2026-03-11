import type { FormEventHandler } from "react";
import { AlertCircle } from "lucide-react";

interface AddDashboardModalProps {
  error: string | null;
  name: string;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onUrlChange: (value: string) => void;
  url: string;
}

export function AddDashboardModal({
  error,
  name,
  onClose,
  onNameChange,
  onSubmit,
  onUrlChange,
  url,
}: AddDashboardModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Add Dashboard</h2>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {error ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          ) : null}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="e.g. Production Grafana"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">URL</label>
            <input
              type="url"
              required
              value={url}
              onChange={(event) => onUrlChange(event.target.value)}
              placeholder="https://grafana.example.com"
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
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-blue-600 transition-all cursor-pointer"
            >
              Save Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteAccountModalProps {
  confirmation: string;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  onConfirmationChange: (value: string) => void;
}

export function DeleteAccountModal({
  confirmation,
  deleting,
  error,
  onCancel,
  onConfirm,
  onConfirmationChange,
}: DeleteAccountModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget && !deleting) onCancel(); }}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-red-500">Delete Account</h2>
        </div>
        <div className="p-6 space-y-4">
          {error ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          ) : null}
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">This action is permanent</p>
              <p className="opacity-80">
                All your dashboards, apps, and notification history will be deleted
                immediately. Active Pro subscriptions will be cancelled.
              </p>
            </div>
          </div>
          <p className="text-text-muted text-sm px-1">
            Are you sure you want to delete your account? This action is{" "}
            <strong>irreversible</strong>.
          </p>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-muted px-1 uppercase tracking-wider">
              Type "DELETE MY ACCOUNT" to confirm
            </label>
            <input
              type="text"
              value={confirmation}
              onChange={(event) => onConfirmationChange(event.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <button
              disabled={deleting || confirmation !== "DELETE MY ACCOUNT"}
              onClick={onConfirm}
              className="w-full h-11 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting account...
                </>
              ) : (
                "Yes, delete my account"
              )}
            </button>
            <button
              disabled={deleting}
              onClick={onCancel}
              className="w-full h-11 rounded-lg border border-border text-sm font-medium text-text-muted hover:text-text-main hover:bg-surface-hover transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
