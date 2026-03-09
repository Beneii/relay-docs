import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

import { createBillingPortalHandler } from './_billing.js';
import { getAuthenticatedUser } from './_auth.js';

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'));
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || requireEnv('SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY')
);

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
