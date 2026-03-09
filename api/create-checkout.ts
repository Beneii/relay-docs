import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

import { createCheckoutHandler } from './_billing.js';
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

const handler = createCheckoutHandler({
  getAuthenticatedUser,
  getProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, plan, stripe_customer_id')
      .eq('id', userId)
      .single();

    return data;
  },
  createCheckoutSession: (params) => stripe.checkout.sessions.create(params),
  appUrl: process.env.APP_URL,
  priceIds: {
    monthly: process.env.STRIPE_PRICE_ID_PRO,
    annual: process.env.STRIPE_PRICE_ID_PRO_ANNUAL,
  },
});

export default function route(req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
