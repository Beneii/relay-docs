import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getIp, rateLimit } from './_lib/rateLimit.js';

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || requireEnv('SUPABASE_URL');
const supabaseKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!rateLimit(getIp(req), 60, 60_000)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }
  const token = body?.token;

  if (typeof token !== 'string' || token.trim().length < 32) {
    return res.status(400).json({ error: 'token is required' });
  }

  const { error, data } = await supabase
    .from('apps')
    .update({ heartbeat_last_seen_at: new Date().toISOString(), heartbeat_alerted_at: null })
    .eq('webhook_token', token.trim())
    .select('id')
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to update heartbeat' });
  }

  if (!data) {
    return res.status(404).json({ error: 'App not found' });
  }

  return res.status(200).json({ ok: true });
}
