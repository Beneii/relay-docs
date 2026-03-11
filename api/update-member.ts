import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FEATURE_FLAGS, TEAM_SHARING_DISABLED_MESSAGE } from '../backend/shared/product.ts';
import { getAuthenticatedUser } from './_auth.ts';
import { handleOptions, setCorsHeaders } from './_cors.ts';
import { jsonOk, jsonError } from './_response.ts';
import { assertEnum, assertString, ValidationError } from './_validators.ts';

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
