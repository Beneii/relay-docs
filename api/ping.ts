import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({
    ok: true,
    env: {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasViteSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    },
  });
}
