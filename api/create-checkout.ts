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

  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: 'Missing userId or email' });
  }

  // Verify the user exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (!profile) {
    return res.status(403).json({ error: 'Invalid user' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_PRO,
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL || 'https://relayapp.dev'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'https://relayapp.dev'}/pricing`,
      client_reference_id: userId,
      customer_email: email,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
