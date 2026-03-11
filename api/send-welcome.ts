import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendWelcomeEmail } from './_email.js';
import { getAuthenticatedUser, getRequestHeader } from './_auth.js';
import { handleOptions, setCorsHeaders } from './_cors.js';
import { jsonOk, jsonError } from './_response.js';
import { getServiceClient } from './_supabase.js';

const WEBHOOK_SECRET_HEADERS = ['x-supabase-webhook-secret', 'x-webhook-secret'];
const SIGNUP_WINDOW_MS = 5 * 60 * 1000;

const supabase = getServiceClient();

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
    return jsonError(res, 405, 'Method not allowed');
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
      return jsonError(res, 401, 'Missing or invalid authentication');
    }

    email = user.email;
    profileId = user.id;
  }

  if (!email) {
    return jsonError(res, 400, 'Missing email');
  }

  const { data: profile, error: profileError } = await getProfile(profileId, email);

  if (profileError) {
    console.error('Failed to verify signup window for welcome email:', profileError);
    return jsonError(res, 500, 'Failed to verify signup age');
  }

  if (profile?.welcome_email_sent) {
    return jsonOk(res, { sent: false, skipped: true, reason: 'already_sent' });
  }

  const createdAt = profile?.created_at ? new Date(profile.created_at) : null;
  const isRecentSignup =
    createdAt !== null &&
    !Number.isNaN(createdAt.getTime()) &&
    Date.now() - createdAt.getTime() <= SIGNUP_WINDOW_MS;

  if (!isRecentSignup) {
    return jsonOk(res, { sent: false, skipped: true, reason: 'not_recent_signup' });
  }

  // Atomically claim the send slot to prevent duplicate emails from concurrent requests
  if (profile?.id) {
    const { data: claimed } = await supabase
      .from('profiles')
      .update({ welcome_email_sent: true })
      .eq('id', profile.id)
      .eq('welcome_email_sent', false)
      .select('id');

    if (!claimed || claimed.length === 0) {
      return jsonOk(res, { sent: false, skipped: true, reason: 'already_sent' });
    }
  }

  try {
    await sendWelcomeEmail(email);

    return jsonOk(res, { sent: true });
  } catch (error: unknown) {
    console.error('Failed to send welcome email:', error);

    // Roll back the flag so a retry can succeed
    if (profile?.id) {
      await supabase
        .from('profiles')
        .update({ welcome_email_sent: false })
        .eq('id', profile.id);
    }

    return jsonError(res, 500, 'Failed to send welcome email');
  }
}
