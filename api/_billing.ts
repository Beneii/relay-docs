import type { VercelRequest, VercelResponse } from "@vercel/node";
import type Stripe from "stripe";

import { handleOptions, setCorsHeaders } from "./_cors.ts";
import { jsonOk, jsonError } from "./_response.ts";

type AuthenticatedUser = {
  id: string;
  email?: string | null;
};

type CheckoutProfile = {
  id: string;
  plan: "free" | "pro";
  stripe_customer_id: string | null;
};

export interface CheckoutHandlerDeps {
  getAuthenticatedUser: (
    req: Pick<VercelRequest, "headers">
  ) => Promise<AuthenticatedUser | null>;
  getProfile: (userId: string) => Promise<CheckoutProfile | null>;
  createCheckoutSession: (
    params: Stripe.Checkout.SessionCreateParams
  ) => Promise<{ url: string | null }>;
  appUrl?: string;
  priceIds: {
    monthly?: string;
    annual?: string;
  };
  logger?: Pick<Console, "error">;
}

export interface BillingPortalHandlerDeps {
  getAuthenticatedUser: (
    req: Pick<VercelRequest, "headers">
  ) => Promise<AuthenticatedUser | null>;
  getStripeCustomerId: (userId: string) => Promise<string | null>;
  createBillingPortalSession: (params: {
    customer: string;
    return_url: string;
  }) => Promise<{ url: string }>;
  appUrl?: string;
  logger?: Pick<Console, "error">;
}

function getAppBaseUrl(appUrl?: string) {
  return (appUrl || "https://relayapp.dev").trim();
}

export function buildCheckoutSessionParams(args: {
  annual: boolean;
  appUrl?: string;
  priceId: string;
  profile: CheckoutProfile;
  user: Required<Pick<AuthenticatedUser, "id" | "email">>;
}): Stripe.Checkout.SessionCreateParams {
  const baseUrl = getAppBaseUrl(args.appUrl);

  return {
    mode: "subscription",
    line_items: [
      {
        price: args.priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/dashboard?upgraded=1`,
    cancel_url: `${baseUrl}/pricing`,
    client_reference_id: args.user.id,
    ...(args.profile.stripe_customer_id
      ? { customer: args.profile.stripe_customer_id }
      : { customer_email: args.user.email }),
  };
}

export function createCheckoutHandler(deps: CheckoutHandlerDeps) {
  const logger = deps.logger ?? console;

  return async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleOptions(req, res, ["POST", "OPTIONS"])) {
      return;
    }

    setCorsHeaders(req, res, ["POST", "OPTIONS"]);

    if (req.method !== "POST") {
      return jsonError(res, 405, "Method not allowed");
    }

    const user = await deps.getAuthenticatedUser(req);

    if (!user || !user.email) {
      return jsonError(res, 401, "Missing or invalid authentication");
    }

    const { annual } = req.body || {};

    if (typeof annual !== "boolean") {
      return jsonError(res, 400, "annual must be a boolean");
    }

    const priceId = annual ? deps.priceIds.annual : deps.priceIds.monthly;

    if (!priceId) {
      return jsonError(res, 500, "Price configuration missing");
    }

    const profile = await deps.getProfile(user.id);

    if (!profile) {
      return jsonError(res, 403, "Invalid user");
    }

    if (profile.plan === "pro") {
      return jsonError(res, 400, "Already on Pro plan");
    }

    try {
      const session = await deps.createCheckoutSession(
        buildCheckoutSessionParams({
          annual,
          appUrl: deps.appUrl,
          priceId,
          profile,
          user: {
            id: user.id,
            email: user.email,
          },
        })
      );

      return jsonOk(res, { url: session.url });
    } catch (error: unknown) {
      const stripeError =
        typeof error === "object" && error !== null
          ? (error as {
              code?: string;
              param?: string;
              type?: string;
              message?: string;
            })
          : {};

      logger.error(
        `[checkout] msg=${stripeError.message?.substring(0, 120)} code=${stripeError.code} param=${stripeError.param} type=${stripeError.type}`
      );
      return jsonError(res, 500, "Failed to create checkout session");
    }
  };
}

export function createBillingPortalHandler(deps: BillingPortalHandlerDeps) {
  const logger = deps.logger ?? console;

  return async function handler(req: VercelRequest, res: VercelResponse) {
    if (handleOptions(req, res, ["POST", "OPTIONS"])) {
      return;
    }

    setCorsHeaders(req, res, ["POST", "OPTIONS"]);

    if (req.method !== "POST") {
      return jsonError(res, 405, "Method not allowed");
    }

    const user = await deps.getAuthenticatedUser(req);

    if (!user) {
      return jsonError(res, 401, "Missing or invalid authentication");
    }

    const customerId = await deps.getStripeCustomerId(user.id);

    if (!customerId) {
      return jsonError(res, 404, "No billing account found");
    }

    try {
      const session = await deps.createBillingPortalSession({
        customer: customerId,
        return_url: `${getAppBaseUrl(deps.appUrl)}/dashboard`,
      });

      return jsonOk(res, { url: session.url });
    } catch (error: unknown) {
      logger.error("Error creating billing portal session:", error);
      return jsonError(res, 500, "Failed to create billing portal session");
    }
  };
}
