import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Handles auth callback from:
 * 1. OAuth providers (Google/GitHub) — Supabase puts tokens in URL hash
 * 2. Mobile app handoff — tokens passed as query params ?t=access&r=refresh&to=/pricing
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Path 1: Mobile app handoff via query params
        const accessToken = searchParams.get('t');
        const refreshToken = searchParams.get('r');
        const redirect = searchParams.get('to') || '/dashboard';

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setError(true);
            return;
          }

          // Use window.location to ensure clean navigation after session is set
          window.location.replace(redirect);
          return;
        }

        // Path 2: OAuth callback — Supabase auto-detects tokens from hash
        // Wait for Supabase to process the hash fragment
        await new Promise(r => setTimeout(r, 500));

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/dashboard', { replace: true });
          return;
        }

        // Nothing worked
        navigate('/login', { replace: true });
      } catch (e) {
        console.error('Auth callback error:', e);
        setError(true);
      }
    }

    handleCallback();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted text-sm mb-4">
            Something went wrong signing you in.
          </p>
          <Link
            to="/login"
            className="text-accent hover:text-emerald-600 text-sm font-medium"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <div className="text-text-muted text-sm mb-4">Signing you in...</div>
        <Link
          to="/login"
          className="text-text-muted/50 hover:text-text-muted text-xs transition-colors"
        >
          Taking too long? Sign in manually
        </Link>
      </div>
    </div>
  );
}
