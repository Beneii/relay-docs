import assert from "node:assert/strict";
import test from "node:test";

import { createBillingPortalHandler } from "../../api/_billing.ts";
import { createMockRequest, createMockResponse } from "../support/vercel.ts";

test("billing portal handler creates a portal session for users with Stripe customers", async () => {
  let portalParams: Record<string, unknown> | null = null;

  const handler = createBillingPortalHandler({
    getAuthenticatedUser: async () => ({ id: "user_123" }),
    getStripeCustomerId: async () => "cus_123",
    createBillingPortalSession: async (params) => {
      portalParams = params;
      return { url: "https://billing.stripe.test/session" };
    },
    appUrl: "https://relayapp.dev",
    logger: { error() {} },
  });

  const req = createMockRequest({ method: "POST" });
  const res = createMockResponse();

  await handler(req as never, res as never);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.jsonBody, {
    url: "https://billing.stripe.test/session",
  });
  assert.deepEqual(portalParams, {
    customer: "cus_123",
    return_url: "https://relayapp.dev/dashboard",
  });
});

test("billing portal handler returns 404 when no billing account exists", async () => {
  const handler = createBillingPortalHandler({
    getAuthenticatedUser: async () => ({ id: "user_123" }),
    getStripeCustomerId: async () => null,
    createBillingPortalSession: async () => {
      throw new Error("should not be called");
    },
    logger: { error() {} },
  });

  const req = createMockRequest({ method: "POST" });
  const res = createMockResponse();

  await handler(req as never, res as never);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.jsonBody, { error: "No billing account found" });
});
