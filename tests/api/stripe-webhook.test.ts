import assert from "node:assert/strict";
import test from "node:test";

import {
  createStripeWebhookHandler,
  processStripeEvent,
} from "../../api/_stripeWebhook.ts";
import { createMockRequest, createMockResponse } from "../support/vercel.ts";

test("stripe webhook handler short-circuits already processed events", async () => {
  let recorded = false;

  const handler = createStripeWebhookHandler({
    webhookSecret: "whsec_test",
    getRawBody: async () => Buffer.from("payload"),
    constructEvent: () =>
      ({
        id: "evt_processed",
        type: "invoice.paid",
        data: { object: {} },
      }) as never,
    store: {
      getProcessedEvent: async () => ({ exists: true }),
      recordProcessedEvent: async () => {
        recorded = true;
        return {};
      },
      getEmailByCustomerId: async () => null,
      getEmailByUserId: async () => null,
      updateProfileById: async () => ({}),
      updateProfilesByEmail: async () => ({}),
      updateProfilesByCustomerId: async () => ({}),
    },
    stripe: {
      retrieveCustomer: async () => ({}),
      retrieveSubscription: async () => ({
        id: "sub_123",
        items: { data: [] },
        cancel_at_period_end: false,
      }),
    },
    emails: {
      sendProUpgradeEmail: async () => undefined,
      sendSubscriptionCancelledEmail: async () => undefined,
      sendPaymentFailedEmail: async () => undefined,
    },
    logger: { error() {}, log() {} },
  });

  const req = createMockRequest({
    method: "POST",
    headers: { "stripe-signature": "sig" },
  });
  const res = createMockResponse();

  await handler(req as never, res as never);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.jsonBody, {
    received: true,
    status: "already_processed",
  });
  assert.equal(recorded, false);
});

test("stripe webhook handler upgrades users from checkout completion events", async () => {
  const calls: string[] = [];

  const handler = createStripeWebhookHandler({
    webhookSecret: "whsec_test",
    getRawBody: async () => Buffer.from("payload"),
    constructEvent: () =>
      ({
        id: "evt_checkout",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_123",
            customer: "cus_123",
            client_reference_id: "user_123",
          },
        },
      }) as never,
    store: {
      getProcessedEvent: async () => ({ exists: false }),
      recordProcessedEvent: async () => {
        calls.push("recordProcessed");
        return {};
      },
      getEmailByCustomerId: async () => null,
      getEmailByUserId: async () => "user@example.com",
      updateProfileById: async (_userId, updates) => {
        calls.push(`update:${String(updates.plan)}`);
        return {};
      },
      updateProfilesByEmail: async () => {
        throw new Error("should not be called");
      },
      updateProfilesByCustomerId: async () => {
        throw new Error("should not be called");
      },
    },
    stripe: {
      retrieveCustomer: async () => ({}),
      retrieveSubscription: async () => ({
        id: "sub_123",
        items: { data: [] },
        cancel_at_period_end: false,
      }),
    },
    emails: {
      sendProUpgradeEmail: async () => {
        calls.push("sendUpgradeEmail");
      },
      sendSubscriptionCancelledEmail: async () => undefined,
      sendPaymentFailedEmail: async () => undefined,
    },
    logger: { error() {}, log() {} },
  });

  const req = createMockRequest({
    method: "POST",
    headers: { "stripe-signature": "sig" },
  });
  const res = createMockResponse();

  await handler(req as never, res as never);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.jsonBody, { received: true });
  assert.deepEqual(calls, ["update:pro", "sendUpgradeEmail", "recordProcessed"]);
});

test("processStripeEvent backfills invoice.paid updates by email when customer mapping is missing", async () => {
  let emailBackfill:
    | {
        email: string;
        updates: Record<string, unknown>;
        onlyWithoutStripeCustomerId: boolean | undefined;
      }
    | null = null;

  await processStripeEvent(
    {
      id: "evt_invoice_paid",
      type: "invoice.paid",
      data: {
        object: {
          customer: "cus_123",
          customer_email: "fallback@example.com",
          parent: {
            subscription_details: {
              subscription: "sub_123",
            },
          },
        },
      },
    } as never,
    {
      store: {
        getProcessedEvent: async () => ({ exists: false }),
        recordProcessedEvent: async () => ({}),
        getEmailByCustomerId: async () => null,
        getEmailByUserId: async () => null,
        updateProfileById: async () => ({}),
        updateProfilesByEmail: async (email, updates, options) => {
          emailBackfill = {
            email,
            updates,
            onlyWithoutStripeCustomerId: options?.onlyWithoutStripeCustomerId,
          };
          return {};
        },
        updateProfilesByCustomerId: async () => ({ count: 0 }),
      },
      stripe: {
        retrieveCustomer: async () => ({}),
        retrieveSubscription: async () => ({
          id: "sub_123",
          items: {
            data: [
              {
                plan: { interval: "month" },
                current_period_end: 1_700_000_000,
              },
            ],
          },
          cancel_at_period_end: true,
        }),
      },
      emails: {
        sendProUpgradeEmail: async () => undefined,
        sendSubscriptionCancelledEmail: async () => undefined,
        sendPaymentFailedEmail: async () => undefined,
      },
      logger: { error() {}, log() {} },
    }
  );

  assert.equal(emailBackfill?.email, "fallback@example.com");
  assert.equal(emailBackfill?.onlyWithoutStripeCustomerId, true);
  assert.equal(emailBackfill?.updates.plan, "pro");
  assert.equal(emailBackfill?.updates.billing_interval, "month");
});
