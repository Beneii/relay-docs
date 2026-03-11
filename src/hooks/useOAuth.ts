import { useState } from 'react';
import { supabase } from '../lib/supabase';

type Provider = 'github' | 'google';

interface UseOAuthOptions {
  redirectTo?: string;
}

export function useOAuth(options?: UseOAuthOptions) {
  const [oauthLoading, setOAuthLoading] = useState<Provider | null>(null);
  const [oauthError, setOAuthError] = useState<string | null>(null);

  const handleOAuth = async (provider: Provider) => {
    setOAuthError(null);
    setOAuthLoading(provider);

    const redirectTarget =
      options?.redirectTo ?? (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: redirectTarget ? { redirectTo: redirectTarget } : undefined,
    });

    if (error) {
      setOAuthError(`Authentication failed: ${error.message}`);
      setOAuthLoading(null);
      return;
    }

    setOAuthLoading(null);
  };

  return { handleOAuth, oauthLoading, oauthError };
}
