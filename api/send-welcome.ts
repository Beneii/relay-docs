import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from './_email';
import { getAuthenticatedUser, getRequestHeader } from './_auth';
import { handleOptions, setCorsHeaders } from './_cors';

const WEBHOOK_SECRET_HEADERS = ['x-supabase-webhook-secret', 'x-webhook-secret'];
const SIGNUP_WINDOW_MS = 5 * 60 * 1000;

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || requireEnv('SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

function hasValidWebhookSecret(req: VercelRequest) {
  const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;

  if (!expectedSecret) {
    return false;
  }

  return WEBHOOK_SECRET_HEADERS.some(
    (headerName) => getRequestHeader(req, headerName) === expectedSecret
  );
}

async function getProfile(profileId?: string | null, email?: string | null) {
  if (profileId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, created_at, welcome_email_sent')
      .eq('id', profileId)
      .maybeSingle();

    return { data, error };
  }

  if (!email) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, created_at, welcome_email_sent')
    .eq('email', email)
    .maybeSingle();

  return { data, error };
}

// Called by Supabase webhook on new user signup, or from the frontend after signup
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res, ['POST', 'OPTIONS'])) {
    return;
  }

  setCorsHeaders(req, res, ['POST', 'OPTIONS']);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookRequest = hasValidWebhookSecret(req);

  let email: string | undefined | null;
  let profileId: string | undefined | null;

  if (webhookRequest) {
    email = req.body?.record?.email || req.body?.email;
    profileId = req.body?.record?.id || req.body?.id;
  } else {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Missing or invalid authentication' });
    }

    email = user.email;
    profileId = user.id;
  }

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  const { data: profile, error: profileError } = await getProfile(profileId, email);

  if (profileError) {
    console.error('Failed to verify signup window for welcome email:', profileError);
    return res.status(500).json({ error: 'Failed to verify signup age' });
  }

  if (profile?.welcome_email_sent) {
    return res.status(200).json({
      sent: false,
      skipped: true,
      reason: 'already_sent',
    });
  }

  const createdAt = profile?.created_at ? new Date(profile.created_at) : null;
  const isRecentSignup =
    createdAt !== null &&
    !Number.isNaN(createdAt.getTime()) &&
    Date.now() - createdAt.getTime() <= SIGNUP_WINDOW_MS;

  if (!isRecentSignup) {
    return res.status(200).json({
      sent: false,
      skipped: true,
      reason: 'not_recent_signup',
    });
  }

  try {
    await sendWelcomeEmail(email);

    // Mark as sent to prevent duplicates
    if (profile?.id) {
      await supabase
        .from('profiles')
        .update({ welcome_email_sent: true })
        .eq('id', profile.id);
    }

    res.json({ sent: true });
  } catch (error: any) {
    console.error('Failed to send welcome email:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
}
