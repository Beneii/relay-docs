import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireEnv } from './_env.ts';

const supabaseUrl = process.env.VITE_SUPABASE_URL || requireEnv('SUPABASE_URL');
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

let _serviceClient: SupabaseClient | null = null;

/** Service-role client â€” full access, no session persistence. */
export function getServiceClient(): SupabaseClient {
  if (!_serviceClient) {
    _serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _serviceClient;
}

/** User-scoped client using an auth JWT. */
export function getUserClient(token: string): SupabaseClient {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
