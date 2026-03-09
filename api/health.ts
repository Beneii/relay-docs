import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { handleOptions, setCorsHeaders } from './_cors.js';

type HealthResponse = {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  db: {
    status: 'ok' | 'unreachable' | 'not_configured';
    error?: string;
  };
};

const versionPromise = readFile(new URL('../package.json', import.meta.url), 'utf8')
  .then((content) => JSON.parse(content).version || 'unknown')
  .catch(() => 'unknown');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res, ['GET', 'OPTIONS'])) {
    return;
  }

  setCorsHeaders(req, res, ['GET', 'OPTIONS']);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const timestamp = new Date().toISOString();
  const version = await versionPromise;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const response: HealthResponse = {
    status: 'ok',
    timestamp,
    version,
    db: {
      status: 'not_configured',
    },
  };

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    response.status = 'degraded';
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json(response);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error } = await supabase
      .from('profiles')
      .select('id', { head: true, count: 'exact' })
      .limit(1);

    if (error) {
      console.error('Health check DB error:', error.message);
      response.status = 'error';
      response.db = {
        status: 'unreachable',
      };

      res.setHeader('Cache-Control', 'no-store');
      return res.status(503).json(response);
    }

    response.db.status = 'ok';
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(response);
  } catch (error: unknown) {
    console.error('Health check unexpected error:', error instanceof Error ? error.message : error);
    response.status = 'error';
    response.db = {
      status: 'unreachable',
    };

    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json(response);
  }
}
