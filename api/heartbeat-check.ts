import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_supabase.js';
import { jsonOk, jsonError } from './_response.js';
import { requireEnv } from './_env.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || requireEnv('SUPABASE_URL');
const cronSecret = requireEnv('CRON_SECRET');
const notifyUrl = `${supabaseUrl}/functions/v1/notify`;
const supabase = getServiceClient();

type HeartbeatApp = {
  id: string;
  name: string | null;
  webhook_token: string;
  heartbeat_interval_minutes: number | null;
  heartbeat_last_seen_at: string | null;
  heartbeat_alerted_at: string | null;
};

function isStale(app: HeartbeatApp) {
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
    return jsonError(res, 405, 'Method not allowed');
  }

  const auth = req.headers.authorization;
  if (auth !== `Bearer ${cronSecret}`) {
    return jsonError(res, 401, 'Unauthorized');
  }

  const { data, error } = await supabase
    .from('apps')
    .select('id, name, webhook_token, heartbeat_interval_minutes, heartbeat_last_seen_at, heartbeat_alerted_at')
    .not('heartbeat_interval_minutes', 'is', null);

  if (error) {
    return jsonError(res, 500, 'Failed to load apps');
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

  return jsonOk(res, { checked: data?.length || 0, alerts: staleApps.length });
}
