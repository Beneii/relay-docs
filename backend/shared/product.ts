export type Plan = "free" | "pro";

export const FREE_LIMITS = {
  dashboards: 3,
  devices: 1,
  notificationsPerMonth: 100,
} as const;

export const PRO_LIMITS = {
  dashboards: Number.POSITIVE_INFINITY,
  devices: 10,
  notificationsPerMonth: 10_000,
} as const;

export const NOTIFICATION_HISTORY_LIMITS = {
  free: 10,
  pro: 50,
} as const;

export function getLimits(plan: Plan) {
  return plan === "pro" ? PRO_LIMITS : FREE_LIMITS;
}
