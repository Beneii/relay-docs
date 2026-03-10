export type Plan = "free" | "pro";

export const FREE_LIMITS = {
  dashboards: 3,
  devices: 1,
  notificationsPerMonth: 500,
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

export const PRO_PRICING = {
  monthly: {
    price: 7.99,
    label: "$7.99",
    interval: "month",
  },
  annual: {
    price: 79,
    label: "$79",
    monthlyEquivalent: "$6.58",
    interval: "year",
    savingsPercent: 17,
  },
  currency: "USD",
} as const;

export const FREE_FEATURES = [
  `${FREE_LIMITS.dashboards} dashboards`,
  `${FREE_LIMITS.devices} device`,
  `${FREE_LIMITS.notificationsPerMonth} notifications/month`,
  "@relayapp/sdk + REST API access",
  "Webhook API access",
] as const;

export const PRO_FEATURES = [
  "Unlimited dashboards & projects",
  `Up to ${PRO_LIMITS.devices} devices`,
  `${PRO_LIMITS.notificationsPerMonth.toLocaleString()} notifications/month`,
  "Interactive action buttons + SDK features",
  "Team sharing & collaboration",
  "Notification history & metadata events",
  "Priority support",
] as const;

export function getLimits(plan: Plan) {
  return plan === "pro" ? PRO_LIMITS : FREE_LIMITS;
}
