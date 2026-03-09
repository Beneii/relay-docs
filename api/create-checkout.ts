import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from './_auth.js';
import { handleOptions, setCorsHeaders } from './_cors.js';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res, ['POST', 'OPTIONS'])) {
    return;
  }

  setCorsHeaders(req, res, ['POST', 'OPTIONS']);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthenticatedUser(req);

  if (!user || !user.email) {
    return res.status(401).json({ error: 'Missing or invalid authentication' });
  }

  const { annual } = req.body || {};

  if (typeof annual !== 'boolean') {
    return res.status(400).json({ error: 'annual must be a boolean' });
  }

  const userId = user.id;
  const email = user.email;

  const priceId = annual
    ? process.env.STRIPE_PRICE_ID_PRO_ANNUAL
    : process.env.STRIPE_PRICE_ID_PRO;

  if (!priceId) {
    return res.status(500).json({ error: 'Price configuration missing' });
  }

  // Verify the user exists and check current plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, plan, stripe_customer_id')
    .eq('id', userId)
    .single();

  if (!profile) {
    return res.status(403).json({ error: 'Invalid user' });
  }

  if (profile.plan === 'pro') {
    return res.status(400).json({ error: 'Already on Pro plan' });
  }

  try {
    // Reuse existing Stripe customer if available, otherwise use email
    const customerParams: { customer?: string; customer_email?: string } = profile.stripe_customer_id
      ? { customer: profile.stripe_customer_id }
      : { customer_email: email };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${(process.env.APP_URL || 'https://relayapp.dev').trim()}/dashboard?upgraded=1`,
      cancel_url: `${(process.env.APP_URL || 'https://relayapp.dev').trim()}/pricing`,
      client_reference_id: userId,
      ...customerParams,
    });

    res.json({ url: session.url });
  } catch (error: unknown) {
    const stripeError =
      typeof error === 'object' && error !== null
        ? (error as { code?: string; param?: string; type?: string; message?: string })
        : {};
    console.error(
      `[checkout] msg=${stripeError.message?.substring(0, 120)} code=${stripeError.code} param=${stripeError.param} type=${stripeError.type}`
    );
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
