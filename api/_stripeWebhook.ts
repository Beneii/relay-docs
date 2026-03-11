import type { VercelRequest, VercelResponse } from "@vercel/node";
import type Stripe from "stripe";

import { jsonOk, jsonError } from "./_response.ts";

export const STRIPE_WEBHOOK_BODY_CONFIG = {
  api: {
    bodyParser: false,
  },
};

export class StripeWebhookHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface StripeWebhookStore {
  getProcessedEvent: (
    eventId: string
  ) => Promise<{ exists: boolean; errorCode?: string; error?: unknown }>;
  recordProcessedEvent: (
    event: Pick<Stripe.Event, "id" | "type">
  ) => Promise<{ error?: unknown }>;
  getEmailByCustomerId: (customerId: string) => Promise<string | null>;
  getEmailByUserId: (userId: string) => Promise<string | null>;
  updateProfileById: (
    userId: string,
    updates: Record<string, unknown>
  ) => Promise<{ error?: unknown }>;
  updateProfilesByEmail: (
    email: string,
    updates: Record<string, unknown>,
    options?: { onlyWithoutStripeCustomerId?: boolean }
  ) => Promise<{ error?: unknown; count?: number | null }>;
  updateProfilesByCustomerId: (
    customerId: string,
    updates: Record<string, unknown>,
    options?: { count?: "exact" | null }
  ) => Promise<{ error?: unknown; count?: number | null }>;
}

export interface StripeWebhookGateway {
  retrieveCustomer: (
    customerId: string
  ) => Promise<{ deleted?: boolean; email?: string | null }>;
  retrieveSubscription: (subscriptionId: string) => Promise<{
    id: string;
    items: {
      data: Array<{
        plan?: { interval?: string | null } | null;
        current_period_end?: number | null;
      }>;
    };
    cancel_at_period_end: boolean;
  }>;
}

export interface StripeWebhookEmails {
  sendProUpgradeEmail: (email: string) => Promise<unknown>;
  sendSubscriptionCancelledEmail: (email: string) => Promise<unknown>;
  sendPaymentFailedEmail: (email: string) => Promise<unknown>;
}

export interface StripeWebhookHandlerDeps {
  webhookSecret: string;
  getRawBody?: (req: VercelRequest) => Promise<Buffer>;
  constructEvent: (
    rawBody: Buffer,
    signature: string,
    secret: string
  ) => Stripe.Event;
  store: StripeWebhookStore;
  stripe: StripeWebhookGateway;
  emails: StripeWebhookEmails;
  logger?: Pick<Console, "error" | "log">;
}

export async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

function toSubscriptionUpdate(
  subscription: Pick<
    Stripe.Subscription,
    "id" | "cancel_at_period_end" | "items"
  >,
  plan: "free" | "pro",
  customerId: string
) {
  const firstItem = subscription.items.data[0];
  const currentPeriodEnd = firstItem?.current_period_end;

  return {
    plan,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    billing_interval: firstItem?.plan?.interval ?? null,
    current_period_end: currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
  };
}

async function sendEmailSafely(
  send: (email: string) => Promise<unknown>,
  email: string,
  description: string,
  logger: Pick<Console, "error">
) {
  await send(email).catch((error) =>
    logger.error(`Failed to send ${description}:`, error)
  );
}

function resolveStripeId(field: unknown): string | null {
  if (typeof field === "string") return field;
  if (typeof field === "object" && field !== null && "id" in field) {
    return (field as { id: string }).id;
  }
  return null;
}

function normalizeSignature(signature: string | string[] | undefined): string | null {
  if (!signature) {
    return null;
  }

  return Array.isArray(signature) ? signature[0] || null : signature;
}

export async function processStripeEvent(
  event: Stripe.Event,
  deps: Pick<StripeWebhookHandlerDeps, "emails" | "logger" | "store" | "stripe">
) {
  const logger = deps.logger ?? console;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerId = resolveStripeId(session.customer);
    const userId = session.client_reference_id;

    if (userId) {
      const { error } = await deps.store.updateProfileById(userId, {
        plan: "pro",
        stripe_customer_id: customerId,
      });

      if (error) {
        logger.error("Failed to upgrade user to pro:", error);
        throw new StripeWebhookHttpError(500, "Failed to update user plan");
      }

      const email = await deps.store.getEmailByUserId(userId);
      if (email) {
        await sendEmailSafely(
          deps.emails.sendProUpgradeEmail,
          email,
          "Pro upgrade email",
          logger
        );
      }
      return;
    }

    logger.error(
      `checkout.session.completed: no client_reference_id on session ${session.id}`
    );

    const customerEmail = session.customer_details?.email ?? session.customer_email;

    if (!customerEmail) {
      logger.error(
        `checkout.session.completed: no userId and no email on session ${session.id}`
      );
      throw new StripeWebhookHttpError(
        500,
        "Cannot identify user from checkout session"
      );
    }

    const { error, count } = await deps.store.updateProfilesByEmail(customerEmail, {
      plan: "pro",
      stripe_customer_id: customerId,
    });

    if (error) {
      logger.error("Fallback checkout upgrade by email failed:", error);
      throw new StripeWebhookHttpError(500, "Failed to update user plan");
    }

    if (count === 0) {
      logger.error(
        `checkout.session.completed: no profile found for email ${customerEmail}`
      );
      throw new StripeWebhookHttpError(500, "No matching user profile");
    }

    await sendEmailSafely(
      deps.emails.sendProUpgradeEmail,
      customerEmail,
      "Pro upgrade email",
      logger
    );
    return;
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = resolveStripeId(subscription.customer);

    if (!customerId) {
      logger.error("subscription event missing customer ID");
      return;
    }

    const plan =
      subscription.status === "active" || subscription.status === "trialing"
        ? "pro"
        : "free";
    const update = toSubscriptionUpdate(subscription, plan, customerId);

    const { error, count } = await deps.store.updateProfilesByCustomerId(
      customerId,
      update,
      { count: "exact" }
    );

    if (error) {
      logger.error("Failed to update user plan from subscription:", error);
      throw new StripeWebhookHttpError(500, "Failed to update user plan");
    }

    if (count !== 0) {
      return;
    }

    try {
      const customer = await deps.stripe.retrieveCustomer(customerId);

      if (!customer.deleted && customer.email) {
        const { error: backfillError } = await deps.store.updateProfilesByEmail(
          customer.email,
          update,
          { onlyWithoutStripeCustomerId: true }
        );

        if (backfillError) {
          logger.error("Backfill by email on subscription event failed:", backfillError);
        }
      }
    } catch (error) {
      logger.error("Failed to retrieve Stripe customer for backfill:", error);
    }

    return;
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = resolveStripeId(invoice.customer);

    if (!customerId) {
      logger.error("invoice.paid event missing customer ID");
      return;
    }
    const subscriptionId =
      (invoice.parent?.subscription_details?.subscription as string | null) ?? null;

    const update: Record<string, unknown> = {
      plan: "pro",
      stripe_customer_id: customerId,
    };

    if (subscriptionId) {
      try {
        const subscription = await deps.stripe.retrieveSubscription(subscriptionId);
        Object.assign(
          update,
          toSubscriptionUpdate(subscription as Stripe.Subscription, "pro", customerId)
        );
      } catch (error) {
        logger.error("Failed to retrieve subscription on invoice.paid:", error);
      }
    }

    const { error, count } = await deps.store.updateProfilesByCustomerId(
      customerId,
      update,
      { count: "exact" }
    );

    if (error) {
      logger.error("Failed to confirm pro plan on invoice.paid:", error);
      throw new StripeWebhookHttpError(500, "Failed to update user plan");
    }

    if (count === 0 && invoice.customer_email) {
      const { error: fallbackError } = await deps.store.updateProfilesByEmail(
        invoice.customer_email,
        update,
        { onlyWithoutStripeCustomerId: true }
      );

      if (fallbackError) {
        logger.error("Fallback update by email on invoice.paid failed:", fallbackError);
      }
    }

    return;
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = resolveStripeId(subscription.customer);

    if (!customerId) {
      logger.error("subscription.deleted event missing customer ID");
      return;
    }
    const email = await deps.store.getEmailByCustomerId(customerId);

    const { error } = await deps.store.updateProfilesByCustomerId(customerId, {
      plan: "free",
      stripe_subscription_id: null,
      billing_interval: null,
      current_period_end: null,
      cancel_at_period_end: false,
    });

    if (error) {
      logger.error("Failed to downgrade user to free:", error);
      throw new StripeWebhookHttpError(500, "Failed to update user plan");
    }

    if (email) {
      await sendEmailSafely(
        deps.emails.sendSubscriptionCancelledEmail,
        email,
        "cancellation email",
        logger
      );
    }
    return;
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = resolveStripeId(invoice.customer);

    if (!customerId) {
      logger.error("invoice.payment_failed event missing customer ID");
      return;
    }
    const email = await deps.store.getEmailByCustomerId(customerId);

    if (email) {
      await sendEmailSafely(
        deps.emails.sendPaymentFailedEmail,
        email,
        "payment failed email",
        logger
      );
    }
  }
}

export function createStripeWebhookHandler(deps: StripeWebhookHandlerDeps) {
  const logger = deps.logger ?? console;
  const readRawBody = deps.getRawBody ?? getRawBody;

  return async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
      return jsonError(res, 405, "Method not allowed");
    }

    const signature = normalizeSignature(req.headers["stripe-signature"]);

    if (!signature || !deps.webhookSecret) {
      return res.status(400).send("Missing signature or secret");
    }

    let event: Stripe.Event;

    try {
      const rawBody = await readRawBody(req);
      event = deps.constructEvent(rawBody, signature, deps.webhookSecret);
    } catch (error: unknown) {
      logger.error(
        "Webhook signature verification failed:",
        error instanceof Error ? error.message : error
      );
      return res.status(400).send("Invalid signature");
    }

    const processed = await deps.store.getProcessedEvent(event.id);

    if (processed.error && processed.errorCode !== "PGRST116") {
      logger.error(`Error checking idempotency for event ${event.id}:`, processed.error);
    }

    if (processed.exists) {
      logger.log(`Event ${event.id} already processed. Skipping.`);
      return jsonOk(res, { received: true, status: "already_processed" });
    }

    try {
      await processStripeEvent(event, deps);
    } catch (error) {
      logger.error("Error processing webhook:", error);

      if (error instanceof StripeWebhookHttpError) {
        return res.status(error.status).send(error.message);
      }

      return res.status(500).send("Webhook handler failed");
    }

    const { error } = await deps.store.recordProcessedEvent({
      id: event.id,
      type: event.type,
    });

    if (error) {
      logger.error(`Failed to record Stripe event ${event.id}:`, error);
    }

    return jsonOk(res, { received: true });
  };
}
