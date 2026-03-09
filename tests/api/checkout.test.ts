import assert from "node:assert/strict";
import test from "node:test";

import { createCheckoutHandler } from "../../api/_billing.ts";
import { createMockRequest, createMockResponse } from "../support/vercel.ts";

test("checkout handler creates a subscription session for free users", async () => {
  let createdParams: Record<string, unknown> | null = null;

  const handler = createCheckoutHandler({
    getAuthenticatedUser: async () => ({ id: "user_123", email: "user@example.com" }),
    getProfile: async () => ({
      id: "user_123",
      plan: "free",
      stripe_customer_id: null,
    }),
    createCheckoutSession: async (params) => {
      createdParams = params as Record<string, unknown>;
      return { url: "https://checkout.stripe.test/session" };
    },
    appUrl: "https://relayapp.dev",
    priceIds: {
      monthly: "price_monthly",
      annual: "price_annual",
    },
    logger: { error() {} },
  });

  const req = createMockRequest({
    method: "POST",
    body: { annual: false },
  });
  const res = createMockResponse();

  await handler(req as never, res as never);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.jsonBody, {
    url: "https://checkout.stripe.test/session",
  });
  assert.equal(createdParams?.customer_email, "user@example.com");
  assert.equal(createdParams?.client_reference_id, "user_123");
  assert.equal(createdParams?.success_url, "https://relayapp.dev/dashboard?upgraded=1");
});

test("checkout handler rejects users already on pro", async () => {
  const handler = createCheckoutHandler({
    getAuthenticatedUser: async () => ({ id: "user_123", email: "user@example.com" }),
    getProfile: async () => ({
      id: "user_123",
      plan: "pro",
      stripe_customer_id: "cus_123",
    }),
    createCheckoutSession: async () => {
      throw new Error("should not be called");
    },
    priceIds: {
      monthly: "price_monthly",
      annual: "price_annual",
    },
    logger: { error() {} },
  });

  const req = createMockRequest({
    method: "POST",
    body: { annual: true },
  });
  const res = createMockResponse();

  await handler(req as never, res as never);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.jsonBody, { error: "Already on Pro plan" });
});

test("checkout handler validates the annual flag", async () => {
  const handler = createCheckoutHandler({
    getAuthenticatedUser: async () => ({ id: "user_123", email: "user@example.com" }),
    getProfile: async () => null,
    createCheckoutSession: async () => {
      throw new Error("should not be called");
    },
    priceIds: {
      monthly: "price_monthly",
      annual: "price_annual",
    },
    logger: { error() {} },
  });

  const req = createMockRequest({
    method: "POST",
    body: { annual: "yes" },
  });
  const res = createMockResponse();

  await handler(req as never, res as never);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.jsonBody, { error: "annual must be a boolean" });
});
