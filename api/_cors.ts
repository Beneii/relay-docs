import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROD_ORIGIN = 'https://relayapp.dev';
const LOCALHOST_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const DEFAULT_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Webhook-Secret',
  'X-Supabase-Webhook-Secret',
];

function normalizeOrigin(origin: string | string[] | undefined) {
  if (!origin) {
    return null;
  }

  return Array.isArray(origin) ? origin[0] || null : origin;
}

function getAllowedOrigin(req: VercelRequest) {
  const origin = normalizeOrigin(req.headers.origin);

  if (!origin) {
    return PROD_ORIGIN;
  }

  if (origin === PROD_ORIGIN || LOCALHOST_ORIGIN_PATTERN.test(origin)) {
    return origin;
  }

  return PROD_ORIGIN;
}

export function setCorsHeaders(
  req: VercelRequest,
  res: VercelResponse,
  allowedMethods: string[] = ['GET', 'POST', 'OPTIONS']
) {
  res.setHeader('Access-Control-Allow-Origin', getAllowedOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', DEFAULT_ALLOWED_HEADERS.join(', '));
  res.setHeader('Vary', 'Origin');
}

export function handleOptions(
  req: VercelRequest,
  res: VercelResponse,
  allowedMethods: string[] = ['GET', 'POST', 'OPTIONS']
) {
  setCorsHeaders(req, res, allowedMethods);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}
