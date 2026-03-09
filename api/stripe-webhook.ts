import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

import {
  STRIPE_WEBHOOK_BODY_CONFIG,
  createStripeWebhookHandler,
} from './_stripeWebhook.js';
import {
  sendProUpgradeEmail,
  sendSubscriptionCancelledEmail,
  sendPaymentFailedEmail,
} from './_email.js';

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

export const config = STRIPE_WEBHOOK_BODY_CONFIG;

const handler = createStripeWebhookHandler({
  webhookSecret: stripeWebhookSecret,
  constructEvent: (rawBody, signature, secret) =>
    stripe.webhooks.constructEvent(rawBody, signature, secret),
  store: {
    getProcessedEvent: async (eventId) => {
      const { data, error } = await supabase
        .from('processed_stripe_events')
        .select('id')
        .eq('id', eventId)
        .single();

      return {
        exists: Boolean(data),
        error,
        errorCode: error?.code,
      };
    },
    recordProcessedEvent: async (event) => {
      const { error } = await supabase
        .from('processed_stripe_events')
        .insert([{ id: event.id, type: event.type }]);

      return { error };
    },
    getEmailByCustomerId: async (customerId) => {
      const { data } = await supabase
        .from('profiles')
        .select('email')
        .eq('stripe_customer_id', customerId)
        .single();

      return data?.email || null;
    },
    getEmailByUserId: async (userId) => {
      const { data } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      return data?.email || null;
    },
    updateProfileById: async (userId, updates) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      return { error };
    },
    updateProfilesByEmail: async (email, updates, options) => {
      let query = supabase
        .from('profiles')
        .update(updates, { count: 'exact' })
        .eq('email', email);

      if (options?.onlyWithoutStripeCustomerId) {
        query = query.is('stripe_customer_id', null);
      }

      const { error, count } = await query;
      return { error, count };
    },
    updateProfilesByCustomerId: async (customerId, updates, options) => {
      const { error, count } = await supabase
        .from('profiles')
        .update(updates, options?.count ? { count: options.count } : undefined)
        .eq('stripe_customer_id', customerId);

      return { error, count };
    },
  },
  stripe: {
    retrieveCustomer: async (customerId) => {
      const customer = await stripe.customers.retrieve(customerId);

      return {
        deleted: Boolean("deleted" in customer && customer.deleted),
        email: "email" in customer ? customer.email : null,
      };
    },
    retrieveSubscription: (subscriptionId) => stripe.subscriptions.retrieve(subscriptionId),
  },
  emails: {
    sendProUpgradeEmail,
    sendSubscriptionCancelledEmail,
    sendPaymentFailedEmail,
  },
});

export default function route(req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
