import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Check } from 'lucide-react';
import { RelayIcon } from '../components/RelayLogo';
import { OAuthButtons } from '../components/OAuthButtons';
import { useOAuth } from '../hooks/useOAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justConfirmed = searchParams.get('confirmed') === 'true';
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { handleOAuth, oauthLoading, oauthError } = useOAuth();

  useEffect(() => {
    if (oauthError) {
      setError(oauthError);
    }
  }, [oauthError]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResetMessage(null);

    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      if (error.message === 'Email not confirmed') {
        setError('Please check your email and click the confirmation link before signing in.');
      } else if (error.message === 'Invalid login credentials') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      navigate(redirectTo);
    }
  };

  const handleOAuthClick = async (provider: 'github' | 'google') => {
    setResetMessage(null);
    setError(null);
    await handleOAuth(provider);
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Enter your email address first to reset your password.');
      setResetMessage(null);
      return;
    }

    setResetLoading(true);
    setError(null);
    setResetMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setResetLoading(false);
      return;
    }

    setResetMessage('If an account exists for that email, we sent a password reset link.');
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans flex flex-col justify-center py-12 px-4">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="flex justify-center mb-8">
          <RelayIcon size={40} className="text-text-main" />
        </Link>
        <h2 className="text-center text-2xl font-bold tracking-tight mb-1">
          Sign in to Relay
        </h2>
        <p className="text-center text-sm text-text-muted mb-8">
          <Link to="/" className="text-accent hover:text-emerald-600 transition-colors">
            Back to home
          </Link>
        </p>

        <div className="bg-surface rounded-2xl border border-border p-8">
          {justConfirmed && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              Email confirmed! You can now sign in.
            </div>
          )}

          {resetMessage && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              {resetMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <OAuthButtons
            onGoogleClick={() => handleOAuthClick('google')}
            onGitHubClick={() => handleOAuthClick('github')}
            loadingProvider={oauthLoading}
            disabled={loading}
          />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-surface px-3 text-text-muted">or</span>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="block w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm placeholder-text-muted/50 focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 gap-3">
                <label className="block text-sm font-medium text-text-muted">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-xs font-medium text-accent hover:text-emerald-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetLoading ? 'Sending...' : 'Forgot password?'}
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm placeholder-text-muted/50 focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-accent py-2.5 px-4 text-sm font-medium text-white hover:bg-blue-600 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Sign up link */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-muted">
              Don't have an account?{' '}
              <Link to={redirectTo !== '/dashboard' ? `/signup?redirect=${encodeURIComponent(redirectTo)}` : '/signup'} className="text-accent hover:text-emerald-600 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
