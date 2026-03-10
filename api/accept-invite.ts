import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from './_auth.js';
import { handleOptions, setCorsHeaders } from './_cors.js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || requireEnv('SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res, ['POST', 'GET', 'OPTIONS'])) return;
  setCorsHeaders(req, res, ['POST', 'GET', 'OPTIONS']);

  // Accept token from body (POST) or query (GET)
  const token =
    (req.method === 'POST' ? req.body?.token : null) ||
    (typeof req.query.token === 'string' ? req.query.token : null);

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Missing invite token' });
  }

  // Find the invite
  const { data: invite, error: findError } = await supabase
    .from('dashboard_members')
    .select('id, app_id, email, status')
    .eq('invite_token', token)
    .single();

  if (findError || !invite) {
    return res.status(404).json({ error: 'Invite not found' });
  }

  if (invite.status === 'accepted') {
    return res.status(200).json({ ok: true, alreadyAccepted: true });
  }

  if (invite.status === 'declined') {
    return res.status(400).json({ error: 'This invite has been declined' });
  }

  // Get the app name
  const { data: app } = await supabase
    .from('apps')
    .select('name')
    .eq('id', invite.app_id)
    .single();

  const appName = app?.name || 'Unknown';

  // Check if user is authenticated
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return res.status(200).json({
      requiresAuth: true,
      email: invite.email,
      appName,
    });
  }

  // Verify the authenticated user's email matches the invite
  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return res.status(403).json({
      error: 'This invite was sent to a different email address',
      inviteEmail: invite.email,
    });
  }

  // Accept the invite
  const { error: updateError } = await supabase
    .from('dashboard_members')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      user_id: user.id,
    })
    .eq('id', invite.id);

  if (updateError) {
    console.error('Failed to accept invite:', updateError);
    return res.status(500).json({ error: 'Failed to accept invite' });
  }

  return res.status(200).json({ ok: true, appId: invite.app_id, appName });
}
