// Simple in-memory rate limiter (per-IP, resets on Vercel cold start)
const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Returns true if the request is allowed, false if rate limited.
 * @param key   Unique key (e.g. IP address)
 * @param limit Max requests per window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function getIp(req: import('@vercel/node').VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return 'unknown';
}
