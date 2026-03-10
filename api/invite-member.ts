import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from './_auth.js';
import { handleOptions, setCorsHeaders } from './_cors.js';
import { sendInviteEmail } from './_email.js';

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
  if (handleOptions(req, res, ['POST', 'OPTIONS'])) return;
  setCorsHeaders(req, res, ['POST', 'OPTIONS']);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { appId, email, role } = req.body || {};

  if (!appId || typeof appId !== 'string') {
    return res.status(400).json({ error: 'appId is required' });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (role && !['viewer', 'editor'].includes(role)) {
    return res.status(400).json({ error: 'role must be viewer or editor' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check user is Pro
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email')
    .eq('id', user.id)
    .single();

  if (!profile || profile.plan !== 'pro') {
    return res.status(403).json({ error: 'Team sharing requires a Pro plan' });
  }

  // Can't invite yourself
  if (profile.email === normalizedEmail) {
    return res.status(400).json({ error: 'You cannot invite yourself' });
  }

  // Verify app belongs to user
  const { data: app } = await supabase
    .from('apps')
    .select('id, name')
    .eq('id', appId)
    .eq('user_id', user.id)
    .single();

  if (!app) {
    return res.status(404).json({ error: 'Dashboard not found' });
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('dashboard_members')
    .select('id, status')
    .eq('app_id', appId)
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'accepted') {
      return res.status(409).json({ error: 'This user is already a member' });
    }
    if (existing.status === 'pending') {
      return res.status(409).json({ error: 'An invite is already pending for this email' });
    }
  }

  // Look up invitee profile
  const { data: inviteeProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  // Insert member record
  const { data: member, error: insertError } = await supabase
    .from('dashboard_members')
    .insert({
      app_id: appId,
      invited_by: user.id,
      user_id: inviteeProfile?.id || null,
      email: normalizedEmail,
      role: role || 'viewer',
    })
    .select('id, invite_token')
    .single();

  if (insertError) {
    console.error('Failed to create invite:', insertError);
    return res.status(500).json({ error: 'Failed to create invite' });
  }

  // Send invite email
  try {
    const inviterName = profile.email || 'A Relay user';
    const hasAccount = !!inviteeProfile;
    await sendInviteEmail(normalizedEmail, inviterName, app.name, member.invite_token, hasAccount);
  } catch (emailErr) {
    console.error('Failed to send invite email:', emailErr);
    // Non-fatal — invite was created
  }

  return res.status(200).json({ ok: true, inviteId: member.id });
}
