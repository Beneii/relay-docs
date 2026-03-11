import type { VercelRequest } from '@vercel/node';
import type { User } from '@supabase/supabase-js';
import { getServiceClient } from './_supabase.js';

const supabase = getServiceClient();

function normalizeHeaderValue(value: string | string[] | undefined): string | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] || null : value;
}

export function getRequestHeader(
  req: Pick<VercelRequest, 'headers'>,
  headerName: string
): string | null {
  const matchedHeader = Object.keys(req.headers).find(
    (key) => key.toLowerCase() === headerName.toLowerCase()
  );

  if (!matchedHeader) {
    return null;
  }

  return normalizeHeaderValue(req.headers[matchedHeader]);
}

export function getBearerToken(req: Pick<VercelRequest, 'headers'>): string | null {
  const authorization = getRequestHeader(req, 'authorization');

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export async function getAuthenticatedUser(
  req: Pick<VercelRequest, 'headers'>
): Promise<User | null> {
  const token = getBearerToken(req);

  if (!token) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    if (error) {
      console.error('Failed to verify Supabase JWT:', error);
    }

    return null;
  }

  return user;
}

export async function requireAuthenticatedUser(
  req: Pick<VercelRequest, 'headers'>
): Promise<User> {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
