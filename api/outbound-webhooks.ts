import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from './_auth.js';
import { handleOptions, setCorsHeaders } from './_cors.js';
import { getLimits } from '../backend/shared/product.js';

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
      hostname === '0.0.0.0' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
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
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // GET — list webhooks for an app
  if (req.method === 'GET') {
    const { appId } = req.query;
    if (!appId || typeof appId !== 'string') {
      return res.status(400).json({ error: 'appId required' });
    }
    // Verify ownership
    const { data: app } = await supabase.from('apps').select('id').eq('id', appId).eq('user_id', user.id).maybeSingle();
    if (!app) return res.status(403).json({ error: 'App not found or not owned by you' });

    const { data, error } = await supabase
      .from('outbound_webhooks')
      .select('id, url, provider, enabled, last_triggered_at, last_error, created_at')
      .eq('app_id', appId)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ webhooks: data || [] });
  }

  // POST — create or update webhook
  if (req.method === 'POST') {
    const { appId, url, provider = 'custom', secret, enabled = true } = req.body || {};

    if (!appId || !url) return res.status(400).json({ error: 'appId and url required' });
    if (!isValidHttpsUrl(url)) return res.status(400).json({ error: 'url must be a valid https URL (no private IPs)' });
    if (!['custom', 'zapier'].includes(provider)) return res.status(400).json({ error: 'Invalid provider' });

    // Verify ownership + plan
    const { data: app } = await supabase.from('apps').select('id, user_id').eq('id', appId).eq('user_id', user.id).maybeSingle();
    if (!app) return res.status(403).json({ error: 'App not found or not owned by you' });

    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle();
    const plan = (profile?.plan ?? 'free') as 'free' | 'pro';
    const limits = getLimits(plan);

    if (limits.outboundWebhooks === 0) {
      return res.status(403).json({ error: 'Outbound webhooks are a Pro feature. Upgrade at relayapp.dev/pricing' });
    }

    // Check existing count
    const { count } = await supabase
      .from('outbound_webhooks')
      .select('*', { count: 'exact', head: true })
      .eq('app_id', appId);

    if ((count ?? 0) >= limits.outboundWebhooks) {
      return res.status(403).json({ error: `Pro plan allows up to ${limits.outboundWebhooks} outbound webhooks per app` });
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

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, webhook: data });
  }

  // DELETE — remove webhook by id
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'id required' });

    const { error } = await supabase
      .from('outbound_webhooks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
