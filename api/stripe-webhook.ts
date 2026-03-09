import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  sendProUpgradeEmail,
  sendSubscriptionCancelledEmail,
  sendPaymentFailedEmail,
} from './_lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Look up user email from Stripe customer ID
async function getEmailByCustomerId(customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('email')
    .eq('stripe_customer_id', customerId)
    .single();
  return data?.email || null;
}

// Look up user email from user ID
async function getEmailByUserId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();
  return data?.email || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return res.status(400).send('Missing signature or secret');
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const userId = session.client_reference_id;

      if (userId) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            plan: 'pro',
            stripe_customer_id: customerId,
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Failed to upgrade user to pro:', updateError);
          return res.status(500).send('Failed to update user plan');
        }

        const email = await getEmailByUserId(userId);
        if (email) {
          await sendProUpgradeEmail(email).catch((err) =>
            console.error('Failed to send Pro upgrade email:', err)
          );
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const email = await getEmailByCustomerId(customerId);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ plan: 'free' })
        .eq('stripe_customer_id', customerId);

      if (updateError) {
        console.error('Failed to downgrade user to free:', updateError);
        return res.status(500).send('Failed to update user plan');
      }

      if (email) {
        await sendSubscriptionCancelledEmail(email).catch((err) =>
          console.error('Failed to send cancellation email:', err)
        );
      }
    } else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      const email = await getEmailByCustomerId(customerId);
      if (email) {
        await sendPaymentFailedEmail(email).catch((err) =>
          console.error('Failed to send payment failed email:', err)
        );
      }
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).send('Webhook handler failed');
  }

  res.json({ received: true });
}
