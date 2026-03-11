import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getIp, rateLimit } from './_lib/rateLimit.js';
import { jsonOk, jsonError } from './_response.js';
import { getServiceClient } from './_supabase.js';

const supabase = getServiceClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Method not allowed');
  }

  if (!rateLimit(getIp(req), 60, 60_000)) {
    return jsonError(res, 429, 'Rate limit exceeded');
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      return jsonError(res, 400, 'Invalid JSON');
    }
  }
  const token = body?.token;

  if (typeof token !== 'string' || token.trim().length < 32) {
    return jsonError(res, 400, 'token is required');
  }

  const { error, data } = await supabase
    .from('apps')
    .update({ heartbeat_last_seen_at: new Date().toISOString(), heartbeat_alerted_at: null })
    .eq('webhook_token', token.trim())
    .select('id')
    .single();

  if (error) {
    return jsonError(res, 500, 'Failed to update heartbeat');
  }

  if (!data) {
    return jsonError(res, 404, 'App not found');
  }

  return jsonOk(res);
}
