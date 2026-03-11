import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthenticatedUser } from './_auth.js';
import { handleOptions, setCorsHeaders } from './_cors.js';
import { jsonOk, jsonError } from './_response.js';
import { getServiceClient } from './_supabase.js';
import { assertEnum, assertString, ValidationError } from './_validators.js';

const supabase = getServiceClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res, ['POST', 'OPTIONS'])) return;
  setCorsHeaders(req, res, ['POST', 'OPTIONS']);

  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Method not allowed');
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return jsonError(res, 401, 'Unauthorized');
  }

  const { memberId, role: rawRole } = req.body || {};

  let role: 'viewer' | 'editor';
  try {
    assertString(memberId, 'memberId');
    role = assertEnum(rawRole, ['viewer', 'editor'] as const, 'role');
  } catch (e) {
    if (e instanceof ValidationError) {
      return jsonError(res, 400, e.message);
    }
    throw e;
  }

  // Look up the member record to find the app
  const { data: member, error: memberError } = await supabase
    .from('dashboard_members')
    .select('id, app_id, role')
    .eq('id', memberId)
    .single();

  if (memberError || !member) {
    return jsonError(res, 404, 'Member not found');
  }

  // Verify the requesting user owns the app
  const { data: app } = await supabase
    .from('apps')
    .select('id')
    .eq('id', member.app_id)
    .eq('user_id', user.id)
    .single();

  if (!app) {
    return jsonError(res, 403, 'You do not own this dashboard');
  }

  if (member.role === role) {
    return jsonOk(res, { unchanged: true });
  }

  const { error: updateError } = await supabase
    .from('dashboard_members')
    .update({ role })
    .eq('id', memberId);

  if (updateError) {
    console.error('Failed to update member role:', updateError);
    return jsonError(res, 500, 'Failed to update role');
  }

  return jsonOk(res);
}
