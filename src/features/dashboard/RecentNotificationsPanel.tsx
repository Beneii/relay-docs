import { Link } from "react-router-dom";
import { Bell, Dot } from "lucide-react";

import { NOTIFICATION_HISTORY_LIMITS } from "@shared/product";
import { timeAgo } from "@shared/time";

import type { Dashboard, NotificationRecord, UserData } from "./types";

interface RecentNotificationsPanelProps {
  dashboards: Dashboard[];
  notificationHistoryLimit: number;
  recentNotifications: NotificationRecord[];
  user: UserData;
}

export function RecentNotificationsPanel({
  dashboards,
  notificationHistoryLimit,
  recentNotifications,
  user,
}: RecentNotificationsPanelProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="w-5 h-5 text-text-muted" />
          Recent Notifications
        </h2>
        {user.plan === "pro" ? (
          <span className="text-xs text-text-muted">
            Last {NOTIFICATION_HISTORY_LIMITS.pro}
          </span>
        ) : null}
      </div>

      {recentNotifications.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center">
          <Bell className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-30" />
          <h3 className="text-base font-medium mb-1">No notifications yet</h3>
          <p className="text-text-muted text-sm">
            Notifications sent to your dashboards will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {recentNotifications.map((notification) => {
              const appName =
                dashboards.find((dashboard) => dashboard.id === notification.app_id)?.name ??
                "Unknown app";
              const truncatedBody =
                notification.body && notification.body.length > 120
                  ? `${notification.body.slice(0, 120)}\u2026`
                  : (notification.body ?? "");

              return (
                <div
                  key={notification.id}
                  className="px-5 py-4 flex items-start gap-4 hover:bg-surface-hover transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-4 h-4 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3 mb-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-semibold truncate">{notification.title}</p>
                        {notification.severity && notification.severity !== "info" ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide ${
                              notification.severity === "critical"
                                ? "text-red-500"
                                : "text-amber-500"
                            }`}
                          >
                            <Dot className="w-4 h-4" />
                            {notification.severity}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-xs text-text-muted shrink-0 tabular-nums">
                        {timeAgo(notification.created_at)}
                      </span>
                    </div>
                    {truncatedBody ? (
                      <p className="text-sm text-text-muted leading-relaxed">
                        {truncatedBody}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-text-muted opacity-80">
                      <span>{appName}</span>
                      {notification.channel ? (
                        <span className="px-2 py-0.5 border border-border rounded-full text-[11px] uppercase tracking-wide bg-surface-hover">
                          #{notification.channel}
                        </span>
                      ) : null}
                      {notification.actions_json && notification.actions_json.length > 0 ? (
                        <span className="px-2 py-0.5 border border-border rounded-full text-[11px] text-text-muted bg-surface-hover">
                          {notification.actions_json.length} action
                          {notification.actions_json.length > 1 ? "s" : ""}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-text-muted mt-2">
                      {notification.pushed_count && notification.pushed_count > 0
                        ? `Pushed to ${notification.pushed_count} device${
                            notification.pushed_count === 1 ? "" : "s"
                          }`
                        : "No devices registered"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {user.plan === "free" ? (
            <div className="px-5 py-4 border-t border-border bg-surface-hover flex items-center justify-between gap-4">
              <p className="text-sm text-text-muted">
                Showing the last {notificationHistoryLimit} notifications.
              </p>
              <Link
                to="/pricing"
                className="text-sm font-medium text-accent hover:text-emerald-600 transition-colors shrink-0"
              >
                See full history with Pro
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
