import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Check, Crown, Trash2, UserPlus, Users, X } from "lucide-react";

import type { DashboardMember } from "./types";

interface MembersModalProps {
  appId: string;
  appName: string;
  isOwner: boolean;
  isPro: boolean;
  members: DashboardMember[];
  inviteError: string | null;
  inviting: boolean;
  onInvite: (appId: string, email: string, role: string) => Promise<void>;
  onRemove: (memberId: string, appId: string) => Promise<void>;
  onClose: () => void;
}

export function MembersModal({
  appId,
  appName,
  isOwner,
  isPro,
  members,
  inviteError,
  inviting,
  onInvite,
  onRemove,
  onClose,
}: MembersModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [inviteSent, setInviteSent] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInviteSent(false);
    await onInvite(appId, email.trim().toLowerCase(), role);
    setInviteSent(true);
    setEmail("");
  }

  async function handleRemove(memberId: string) {
    setRemovingId(memberId);
    await onRemove(memberId, appId);
    setRemovingId(null);
  }

  const statusBadge = (status: DashboardMember["status"]) => {
    if (status === "accepted") return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">Accepted</span>;
    if (status === "pending") return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">Pending</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-text-muted/10 text-text-muted">Declined</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-base">Team — {appName}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-lg transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Invite form or Pro gate */}
          {isOwner && (
            !isPro ? (
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 text-center">
                <Crown className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="font-semibold text-sm mb-1">Team sharing is a Pro feature</p>
                <p className="text-xs text-text-muted mb-4">Upgrade to invite teammates to your dashboards.</p>
                <Link
                  to="/pricing"
                  className="inline-flex h-9 px-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-emerald-600 transition-all items-center"
                  onClick={onClose}
                >
                  Upgrade to Pro
                </Link>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">Invite a teammate</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="block w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm placeholder-text-muted/50 focus:border-accent focus:outline-none transition-colors"
                  />
                  <div className="flex gap-2">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as "viewer" | "editor")}
                      className="flex-1 rounded-lg border border-border bg-bg px-3 py-2.5 text-sm focus:border-accent focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="viewer">Viewer — can see notifications</option>
                      <option value="editor">Editor — can send notifications</option>
                    </select>
                    <button
                      type="submit"
                      disabled={inviting || !email}
                      className="flex items-center gap-1.5 h-10 px-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-emerald-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {inviting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      Invite
                    </button>
                  </div>
                </form>

                {inviteError && (
                  <div className="flex items-start gap-2 mt-2 text-sm text-red-500">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {inviteError}
                  </div>
                )}
                {inviteSent && !inviteError && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-emerald-500">
                    <Check className="w-4 h-4" />
                    Invite sent!
                  </div>
                )}
              </div>
            )
          )}

          {/* Member list */}
          <div>
            <h3 className="text-sm font-medium text-text-muted mb-3">
              {members.length === 0 ? "No team members yet" : `${members.length} member${members.length !== 1 ? "s" : ""}`}
            </h3>
            {members.length > 0 && (
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-3 p-3 bg-bg rounded-xl border border-border">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{member.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-text-muted capitalize">{member.role}</span>
                        {statusBadge(member.status)}
                      </div>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={removingId === member.id}
                        className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                        title="Remove member"
                      >
                        {removingId === member.id ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
