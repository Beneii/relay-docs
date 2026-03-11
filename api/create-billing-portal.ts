import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

import { createBillingPortalHandler } from './_billing.js';
import { getAuthenticatedUser } from './_auth.js';
import { requireEnv } from './_env.js';
import { getServiceClient } from './_supabase.js';

const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'));
const supabase = getServiceClient();

const handler = createBillingPortalHandler({
  getAuthenticatedUser,
  getStripeCustomerId: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    return data?.stripe_customer_id ?? null;
  },
  createBillingPortalSession: (params) => stripe.billingPortal.sessions.create(params),
  appUrl: process.env.APP_URL,
});

export default function route(req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
