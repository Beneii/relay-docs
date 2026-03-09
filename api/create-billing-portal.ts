import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerId, userId } = req.body;

  if (!customerId || !userId) {
    return res.status(400).json({ error: 'Missing customerId or userId' });
  }

  // Verify the customer ID belongs to this user
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (!profile || profile.stripe_customer_id !== customerId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL || 'https://relayapp.dev'}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({ error: 'Failed to create billing portal session' });
  }
}
