import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FEATURE_FLAGS, TEAM_SHARING_DISABLED_MESSAGE } from '../backend/shared/product.ts';
import { getAuthenticatedUser } from './_auth.ts';
import { handleOptions, setCorsHeaders } from './_cors.ts';
import { jsonOk, jsonError } from './_response.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res, ['POST', 'OPTIONS'])) return;
  setCorsHeaders(req, res, ['POST', 'OPTIONS']);

  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Method not allowed');
  }

  if (!FEATURE_FLAGS.teamSharing) {
    return jsonError(res, 503, TEAM_SHARING_DISABLED_MESSAGE);
  }

  const { getServiceClient } = await import('./_supabase.ts');
  const supabase = getServiceClient();

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return jsonError(res, 401, 'Unauthorized');
  }

  const { appId, email, role } = req.body || {};

  if (!appId || typeof appId !== 'string') {
    return jsonError(res, 400, 'appId is required');
  }
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return jsonError(res, 400, 'Valid email is required');
  }
  if (role && !['viewer', 'editor'].includes(role)) {
    return jsonError(res, 400, 'role must be viewer or editor');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check user is Pro
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email')
    .eq('id', user.id)
    .single();

  if (!profile || profile.plan !== 'pro') {
    return jsonError(res, 403, 'Team sharing requires a Pro plan');
  }

  // Can't invite yourself
  if (profile.email?.toLowerCase() === normalizedEmail) {
    return jsonError(res, 400, 'You cannot invite yourself');
  }

  // Verify app belongs to user
  const { data: app } = await supabase
    .from('apps')
    .select('id, name')
    .eq('id', appId)
    .eq('user_id', user.id)
    .single();

  if (!app) {
    return jsonError(res, 404, 'Dashboard not found');
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
      return jsonError(res, 409, 'This user is already a member');
    }
    if (existing.status === 'pending') {
      return jsonError(res, 409, 'An invite is already pending for this email');
    }
    // 'declined' â€” delete the old record and allow re-invite below
    if (existing.status === 'declined') {
      await supabase.from('dashboard_members').delete().eq('id', existing.id);
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
    return jsonError(res, 500, 'Failed to create invite');
  }

  // Send invite email
  try {
    const { sendInviteEmail } = await import('./_email.ts');
    const inviterName = profile.email || 'A Relay user';
    const hasAccount = !!inviteeProfile;
    await sendInviteEmail(normalizedEmail, inviterName, app.name, member.invite_token, hasAccount);
  } catch (emailErr) {
    console.error('Failed to send invite email:', emailErr);
    // Non-fatal â€” invite was created
  }

  return jsonOk(res, { inviteId: member.id });
}
