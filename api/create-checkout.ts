import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

import { createCheckoutHandler } from './_billing.js';
import { getAuthenticatedUser } from './_auth.js';
import { getServiceClient } from './_supabase.js';
import { requireEnv } from './_env.js';

const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'));
const supabase = getServiceClient();

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
