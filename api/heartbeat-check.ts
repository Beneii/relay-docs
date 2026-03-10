import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || requireEnv('SUPABASE_URL');
const supabaseKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const cronSecret = requireEnv('CRON_SECRET');
const notifyUrl = `${supabaseUrl}/functions/v1/notify`;
const supabase = createClient(supabaseUrl, supabaseKey);

function isStale(app: any) {
  if (!app.heartbeat_interval_minutes) return false;
  const intervalMs = app.heartbeat_interval_minutes * 60 * 1000;
  const lastSeen = app.heartbeat_last_seen_at ? new Date(app.heartbeat_last_seen_at).getTime() : 0;
  const alertedAt = app.heartbeat_alerted_at ? new Date(app.heartbeat_alerted_at).getTime() : 0;
  const now = Date.now();
  const threshold = now - intervalMs;
  if (lastSeen && lastSeen >= threshold) {
    return false;
  }
  if (alertedAt && alertedAt >= threshold) {
    return false;
  }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization;
  if (auth !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('apps')
    .select('id, name, webhook_token, heartbeat_interval_minutes, heartbeat_last_seen_at, heartbeat_alerted_at')
    .not('heartbeat_interval_minutes', 'is', null);

  if (error) {
    return res.status(500).json({ error: 'Failed to load apps' });
  }

  const staleApps = (data || []).filter(isStale);

  for (const app of staleApps) {
    try {
      await fetch(`${notifyUrl}/${app.webhook_token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${app.name || 'Dashboard'} missed a heartbeat`,
          body: 'No heartbeat received within the configured interval.',
          severity: 'critical',
          channel: 'heartbeats',
        }),
      });
      await supabase
        .from('apps')
        .update({ heartbeat_alerted_at: new Date().toISOString() })
        .eq('id', app.id);
    } catch (err) {
      console.error('Failed to send heartbeat alert', err);
    }
  }

  return res.json({ checked: data?.length || 0, alerts: staleApps.length });
}
