import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthenticatedUser } from './_auth.js';
import { handleOptions, setCorsHeaders } from './_cors.js';
import { jsonOk, jsonError } from './_response.js';
import { getServiceClient } from './_supabase.js';
import { getLimits } from '../backend/shared/product.js';

const supabase = getServiceClient();

const ALLOWED_METHODS = ['GET', 'POST', 'DELETE', 'OPTIONS'];

function isValidHttpsUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    // Block private/loopback IPs (SSRF prevention)
    const hostname = u.hostname;
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('169.254.') || // AWS/GCP/Azure instance metadata
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('fd') || // IPv6 ULA (private)
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.localhost')
    ) return false;
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res, ALLOWED_METHODS)) return;
  setCorsHeaders(req, res, ALLOWED_METHODS);

  const user = await getAuthenticatedUser(req);
  if (!user) return jsonError(res, 401, 'Unauthorized');

  // GET — list webhooks for an app
  if (req.method === 'GET') {
    const { appId } = req.query;
    if (!appId || typeof appId !== 'string') {
      return jsonError(res, 400, 'appId required');
    }
    // Verify ownership
    const { data: app } = await supabase.from('apps').select('id').eq('id', appId).eq('user_id', user.id).maybeSingle();
    if (!app) return jsonError(res, 403, 'App not found or not owned by you');

    const { data, error } = await supabase
      .from('outbound_webhooks')
      .select('id, url, provider, enabled, last_triggered_at, last_error, created_at')
      .eq('app_id', appId)
      .order('created_at', { ascending: true });

    if (error) return jsonError(res, 500, error.message);
    return jsonOk(res, { webhooks: data || [] });
  }

  // POST — create or update webhook
  if (req.method === 'POST') {
    const { appId, url, provider = 'custom', secret, enabled = true } = req.body || {};

    if (!appId || !url) return jsonError(res, 400, 'appId and url required');
    if (!isValidHttpsUrl(url)) return jsonError(res, 400, 'url must be a valid https URL (no private IPs)');
    if (!['custom', 'zapier'].includes(provider)) return jsonError(res, 400, 'Invalid provider');

    // Verify ownership + plan
    const { data: app } = await supabase.from('apps').select('id, user_id').eq('id', appId).eq('user_id', user.id).maybeSingle();
    if (!app) return jsonError(res, 403, 'App not found or not owned by you');

    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle();
    const plan = (profile?.plan ?? 'free') as 'free' | 'pro';
    const limits = getLimits(plan);

    if (limits.outboundWebhooks === 0) {
      return jsonError(res, 403, 'Outbound webhooks are a Pro feature. Upgrade at relayapp.dev/pricing');
    }

    // Check existing count
    const { count } = await supabase
      .from('outbound_webhooks')
      .select('*', { count: 'exact', head: true })
      .eq('app_id', appId);

    if ((count ?? 0) >= limits.outboundWebhooks) {
      return jsonError(res, 403, `Pro plan allows up to ${limits.outboundWebhooks} outbound webhooks per app`);
    }

    const { data, error } = await supabase
      .from('outbound_webhooks')
      .upsert({
        user_id: user.id,
        app_id: appId,
        url,
        provider,
        secret: secret || null,
        enabled,
      }, { onConflict: 'app_id,provider' })
      .select('id, url, provider, enabled, created_at')
      .single();

    if (error) return jsonError(res, 500, error.message);
    return jsonOk(res, { webhook: data });
  }

  // DELETE — remove webhook by id
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || typeof id !== 'string') return jsonError(res, 400, 'id required');

    const { error } = await supabase
      .from('outbound_webhooks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return jsonError(res, 500, error.message);
    return jsonOk(res);
  }

  return jsonError(res, 405, 'Method not allowed');
}
