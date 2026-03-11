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
  if (handleOptions(req, res, ['POST', 'OPTIONS'])) return;
  setCorsHeaders(req, res, ['POST', 'OPTIONS']);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { memberId, role } = req.body || {};

  if (!memberId || typeof memberId !== 'string') {
    return res.status(400).json({ error: 'memberId is required' });
  }
  if (!role || !['viewer', 'editor'].includes(role)) {
    return res.status(400).json({ error: 'role must be viewer or editor' });
  }

  // Look up the member record to find the app
  const { data: member, error: memberError } = await supabase
    .from('dashboard_members')
    .select('id, app_id, role')
    .eq('id', memberId)
    .single();

  if (memberError || !member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  // Verify the requesting user owns the app
  const { data: app } = await supabase
    .from('apps')
    .select('id')
    .eq('id', member.app_id)
    .eq('user_id', user.id)
    .single();

  if (!app) {
    return res.status(403).json({ error: 'You do not own this dashboard' });
  }

  if (member.role === role) {
    return res.status(200).json({ ok: true, unchanged: true });
  }

  const { error: updateError } = await supabase
    .from('dashboard_members')
    .update({ role })
    .eq('id', memberId);

  if (updateError) {
    console.error('Failed to update member role:', updateError);
    return res.status(500).json({ error: 'Failed to update role' });
  }

  return res.status(200).json({ ok: true });
}
