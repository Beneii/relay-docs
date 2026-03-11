import { Link } from "react-router-dom";
import { AlertCircle, CreditCard, Settings, UserX } from "lucide-react";

import { FREE_LIMITS, PRO_LIMITS } from "@shared/product";

import type { UserData } from "./types";

interface AccountSidebarProps {
  notificationLimit: number;
  notificationPercent: number;
  notificationsUsed: number;
  onManageBilling: () => void;
  onShowDeleteModal: () => void;
  user: UserData;
}

export function AccountSidebar({
  notificationLimit,
  notificationPercent,
  notificationsUsed,
  onManageBilling,
  onShowDeleteModal,
  user,
}: AccountSidebarProps) {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-text-muted" />
          Account
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-muted mb-1">Email</p>
            <p className="font-medium text-sm">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted mb-1">Plan</p>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                  user.plan === "pro"
                    ? "bg-accent/10 text-accent"
                    : "bg-surface-hover text-text-muted"
                }`}
              >
                {user.plan}
              </span>
              {user.plan === "free" ? (
                <Link
                  to="/pricing"
                  className="text-xs text-accent hover:text-emerald-600 font-medium transition-colors"
                >
                  Upgrade
                </Link>
              ) : null}
            </div>
            {user.plan === "pro" && user.cancel_at_period_end && user.current_period_end ? (
              <div className="mt-3 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-text-muted leading-relaxed">
                    Your subscription is set to cancel on{" "}
                    <span className="text-text-main font-medium">
                      {new Date(user.current_period_end).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    .
                  </p>
                </div>
                <button
                  onClick={onManageBilling}
                  className="inline-flex items-center justify-center w-full h-8 rounded-lg bg-red-500/10 text-red-500 text-xs font-semibold hover:bg-red-500/20 transition-all cursor-pointer"
                >
                  Reactivate Subscription
                </button>
              </div>
            ) : null}
            {user.plan === "free" ? (
              <div className="mt-3 bg-accent/5 border border-accent/20 rounded-xl p-3">
                <p className="text-xs text-text-muted leading-relaxed mb-2">
                  Free plan:{" "}
                  <span className="text-text-main font-medium">
                    {FREE_LIMITS.dashboards} dashboards, {FREE_LIMITS.devices} device,{" "}
                    {FREE_LIMITS.notificationsPerMonth} notifications/month.
                  </span>{" "}
                  Upgrade for unlimited dashboards, up to {PRO_LIMITS.devices} devices,
                  and {PRO_LIMITS.notificationsPerMonth.toLocaleString()} notifications.
                </p>
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center w-full h-8 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-blue-600 transition-all"
                >
                  Upgrade to Pro
                </Link>
              </div>
            ) : null}
          </div>
          <div>
            <p className="text-sm text-text-muted mb-2">Notifications this month</p>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="font-medium">{notificationsUsed.toLocaleString()}</span>
              <span className="text-text-muted">{notificationLimit.toLocaleString()}</span>
            </div>
            <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${notificationPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <button
            onClick={onManageBilling}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-surface-hover border border-border text-sm font-medium hover:bg-bg transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            Manage Billing
          </button>
          <button
            onClick={onShowDeleteModal}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-red-500/5 border border-red-500/10 text-sm font-medium text-red-500/70 hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer mt-2"
          >
            <UserX className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
