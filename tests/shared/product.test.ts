import assert from "node:assert/strict";
import test from "node:test";

import {
  FREE_LIMITS,
  NOTIFICATION_HISTORY_LIMITS,
  PRO_LIMITS,
  getLimits,
} from "../../backend/shared/product.ts";

test("shared product limits expose the expected free and pro caps", () => {
  assert.deepEqual(FREE_LIMITS, {
    dashboards: 3,
    devices: 1,
    notificationsPerMonth: 500,
    customBranding: false,
    outboundWebhooks: 0,
  });
  assert.equal(PRO_LIMITS.devices, 10);
  assert.equal(PRO_LIMITS.notificationsPerMonth, 10_000);
});

test("getLimits returns the matching plan configuration", () => {
  assert.equal(getLimits("free"), FREE_LIMITS);
  assert.equal(getLimits("pro"), PRO_LIMITS);
});

test("notification history limits stay aligned with plan tiers", () => {
  assert.deepEqual(NOTIFICATION_HISTORY_LIMITS, {
    free: 10,
    pro: 50,
  });
});
