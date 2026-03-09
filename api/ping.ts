import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({
    ok: true,
    env: {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      stripeKeyMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'live' : process.env.STRIPE_SECRET_KEY?.startsWith('sk_test') ? 'test' : 'unknown',
      hasViteSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasPriceIdPro: !!process.env.STRIPE_PRICE_ID_PRO,
      hasPriceIdProAnnual: !!process.env.STRIPE_PRICE_ID_PRO_ANNUAL,
      priceIdProPrefix: process.env.STRIPE_PRICE_ID_PRO?.substring(0, 10) || null,
    },
  });
}
