import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthenticatedUser } from './_auth.js';
import { handleOptions, setCorsHeaders } from './_cors.js';
import { jsonOk, jsonError } from './_response.js';
import { getServiceClient } from './_supabase.js';

const supabase = getServiceClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res, ['POST', 'GET', 'OPTIONS'])) return;
  setCorsHeaders(req, res, ['POST', 'GET', 'OPTIONS']);

  // Accept token from body (POST) or query (GET)
  const token =
    (req.method === 'POST' ? req.body?.token : null) ||
    (typeof req.query.token === 'string' ? req.query.token : null);

  if (!token || typeof token !== 'string') {
    return jsonError(res, 400, 'Missing invite token');
  }

  // Find the invite
  const { data: invite, error: findError } = await supabase
    .from('dashboard_members')
    .select('id, app_id, email, status')
    .eq('invite_token', token)
    .single();

  if (findError || !invite) {
    return jsonError(res, 404, 'Invite not found');
  }

  if (invite.status === 'accepted') {
    return jsonOk(res, { alreadyAccepted: true });
  }

  if (invite.status === 'declined') {
    return jsonError(res, 400, 'This invite has been declined');
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
    return jsonOk(res, { requiresAuth: true, email: invite.email, appName });
  }

  // Verify the authenticated user's email matches the invite
  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return jsonError(res, 403, 'This invite was sent to a different email address');
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
    return jsonError(res, 500, 'Failed to accept invite');
  }

  return jsonOk(res, { appId: invite.app_id, appName });
}
