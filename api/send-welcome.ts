import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from './_lib/email';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Called by Supabase webhook on new user signup, or from the frontend after signup
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Support both Supabase webhook payload and direct call
  const email = req.body?.record?.email || req.body?.email;
  const userId = req.body?.record?.id || req.body?.userId;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  // Simple auth: either comes from Supabase webhook (has record) or needs a valid userId
  if (!req.body?.record && userId) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!data) {
      return res.status(403).json({ error: 'Invalid user' });
    }
  }

  try {
    await sendWelcomeEmail(email);
    res.json({ sent: true });
  } catch (error: any) {
    console.error('Failed to send welcome email:', error);
    res.status(500).json({ error: error.message });
  }
}
