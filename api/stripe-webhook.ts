import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  sendProUpgradeEmail,
  sendSubscriptionCancelledEmail,
  sendPaymentFailedEmail,
} from './_lib/email';

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
const stripeWebhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET');

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
  const endpointSecret = stripeWebhookSecret;

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

  // Idempotency: Check if we've already processed this event
  const { data: alreadyProcessed, error: checkError } = await supabase
    .from('processed_stripe_events')
    .select('id')
    .eq('id', event.id)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error(`Error checking idempotency for event ${event.id}:`, checkError);
  }

  if (alreadyProcessed) {
    console.log(`Event ${event.id} already processed. Skipping.`);
    return res.json({ received: true, status: 'already_processed' });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const userId = session.client_reference_id;

      if (userId) {
        // Set up the profile with stripe customer ID and upgrade to pro
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
    } else if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;

      const plan = (status === 'active' || status === 'trialing') ? 'pro' : 'free';

      const { error: updateError, count: subUpdateCount } = await supabase
        .from('profiles')
        .update({
          plan,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          billing_interval: subscription.items.data[0]?.plan?.interval ?? null,
          current_period_end: (() => {
            const end = subscription.items.data[0]?.current_period_end;
            return end ? new Date(end * 1000).toISOString() : null;
          })(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }, { count: 'exact' })
        .eq('stripe_customer_id', customerId);

      if (updateError) {
        console.error('Failed to update user plan from subscription:', updateError);
        return res.status(500).send('Failed to update user plan');
      }

      // Backfill: if no profile matched by stripe_customer_id (checkout event delayed),
      // look up by the subscription metadata or customer email from Stripe
      if (subUpdateCount === 0) {
        try {
          const customerObj = await stripe.customers.retrieve(customerId) as Stripe.Customer | Stripe.DeletedCustomer;
          if (customerObj && !customerObj.deleted && (customerObj as Stripe.Customer).email) {
            const activeCustomer = customerObj as Stripe.Customer;
            const { error: backfillError } = await supabase
              .from('profiles')
              .update({
                plan,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscription.id,
                billing_interval: subscription.items.data[0]?.plan?.interval ?? null,
                current_period_end: (() => {
                  const end = subscription.items.data[0]?.current_period_end;
                  return end ? new Date(end * 1000).toISOString() : null;
                })(),
                cancel_at_period_end: subscription.cancel_at_period_end,
              })
              .eq('email', activeCustomer.email)
              .is('stripe_customer_id', null);

            if (backfillError) {
              console.error('Backfill by email on subscription event failed:', backfillError);
            }
          }
        } catch (custErr) {
          console.error('Failed to retrieve Stripe customer for backfill:', custErr);
        }
      }
    } else if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const subscriptionId = (invoice.parent?.subscription_details?.subscription as string | null) ?? null;

      // Build update payload — always confirm pro + set customer ID
      const update: Record<string, unknown> = {
        plan: 'pro',
        stripe_customer_id: customerId,
      };

      // Fetch subscription to get current billing details
      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          update.stripe_subscription_id = sub.id;
          update.billing_interval = sub.items.data[0]?.plan?.interval ?? null;
          const periodEnd = sub.items.data[0]?.current_period_end;
          update.current_period_end = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
          update.cancel_at_period_end = sub.cancel_at_period_end;
        } catch (subErr) {
          console.error('Failed to retrieve subscription on invoice.paid:', subErr);
        }
      }

      // Try matching by stripe_customer_id first
      const { error: updateError, count } = await supabase
        .from('profiles')
        .update(update, { count: 'exact' })
        .eq('stripe_customer_id', customerId);

      if (updateError) {
        console.error('Failed to confirm pro plan on invoice.paid:', updateError);
        return res.status(500).send('Failed to update user plan');
      }

      // Fallback: if no profile matched by customer ID (checkout.session.completed
      // hasn't set it yet, or event arrived first), match by invoice email
      if (count === 0 && invoice.customer_email) {
        const { error: fallbackError } = await supabase
          .from('profiles')
          .update(update)
          .eq('email', invoice.customer_email)
          .is('stripe_customer_id', null);

        if (fallbackError) {
          console.error('Fallback update by email on invoice.paid failed:', fallbackError);
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const email = await getEmailByCustomerId(customerId);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          plan: 'free',
          stripe_subscription_id: null,
          billing_interval: null,
          current_period_end: null,
          cancel_at_period_end: false,
        })
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

  // Idempotency: Mark as processed only after SUCCESSFUL execution
  // This ensures that if the business logic above fails, Stripe will retry and we will re-attempt.
  const { error: insertError } = await supabase
    .from('processed_stripe_events')
    .insert([{ id: event.id, type: event.type }]);

  if (insertError) {
    console.error(`Failed to record Stripe event ${event.id}:`, insertError);
  }

  res.json({ received: true });
}
