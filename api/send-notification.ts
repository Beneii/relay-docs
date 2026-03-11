import type { VercelRequest, VercelResponse } from '@vercel/node';

import { getAuthenticatedUser } from './_auth.ts';
import { handleOptions, setCorsHeaders } from './_cors.ts';
import { requireEnv } from './_env.ts';
import { jsonError } from './_response.ts';
import { getServiceClient } from './_supabase.ts';

const supabase = getServiceClient();
const supabaseUrl = process.env.VITE_SUPABASE_URL || requireEnv('SUPABASE_URL');

type SendNotificationBody = {
  appId?: unknown;
  title?: unknown;
  body?: unknown;
  eventType?: unknown;
  metadata?: unknown;
  actions?: unknown;
  severity?: unknown;
  channel?: unknown;
  url?: unknown;
};

function getPayload(body: SendNotificationBody) {
  const payload: Record<string, unknown> = {};

  if (body.title !== undefined) payload.title = body.title;
  if (body.body !== undefined) payload.body = body.body;
  if (body.eventType !== undefined) payload.eventType = body.eventType;
  if (body.metadata !== undefined) payload.metadata = body.metadata;
  if (body.actions !== undefined) payload.actions = body.actions;
  if (body.severity !== undefined) payload.severity = body.severity;
  if (body.channel !== undefined) payload.channel = body.channel;
  if (body.url !== undefined) payload.url = body.url;

  return payload;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res, ['POST', 'OPTIONS'])) {
    return;
  }

  setCorsHeaders(req, res, ['POST', 'OPTIONS']);

  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Method not allowed');
  }

  const user = await getAuthenticatedUser(req);

  if (!user) {
    return jsonError(res, 401, 'Unauthorized');
  }

  const requestBody = (req.body || {}) as SendNotificationBody;
  const appId = typeof requestBody.appId === 'string' ? requestBody.appId : null;

  if (!appId) {
    return jsonError(res, 400, 'appId is required');
  }

  const { data: app, error: appError } = await supabase
    .from('apps')
    .select('id, user_id, webhook_token')
    .eq('id', appId)
    .single();

  if (appError || !app) {
    return jsonError(res, 404, 'Dashboard not found');
  }

  let canSend = app.user_id === user.id;

  if (!canSend) {
    const { data: membership } = await supabase
      .from('dashboard_members')
      .select('role, status')
      .eq('app_id', app.id)
      .eq('user_id', user.id)
      .maybeSingle();

    canSend = membership?.status === 'accepted' && membership.role === 'editor';
  }

  if (!canSend) {
    return jsonError(res, 403, 'You do not have permission to send notifications for this dashboard');
  }

  const notifyResponse = await fetch(`${supabaseUrl}/functions/v1/notify/${app.webhook_token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(getPayload(requestBody)),
  });

  const rawResponse = await notifyResponse.text();
  const contentType = notifyResponse.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return res.status(notifyResponse.status).send(rawResponse);
  }

  if (notifyResponse.ok) {
    return res.status(notifyResponse.status).json({ ok: true });
  }

  return jsonError(res, notifyResponse.status, rawResponse || 'Failed to send notification');
}
