import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from './_lib/auth';
import { handleOptions, setCorsHeaders } from './_lib/cors';

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

let stripe: Stripe;
let supabase: ReturnType<typeof createClient>;
try {
  stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'));
  supabase = createClient(
    process.env.VITE_SUPABASE_URL || requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  );
  console.log('[create-checkout] module init OK');
} catch (initErr: any) {
  console.error('[create-checkout] module init FAILED:', initErr?.message);
  throw initErr;
}

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
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL || 'https://relayapp.dev'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'https://relayapp.dev'}/pricing`,
      client_reference_id: userId,
      ...customerParams,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
      requestId: error.requestId,
    });
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
