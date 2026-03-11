import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Check, X } from 'lucide-react';
import { RelayIcon } from '../components/RelayLogo';
import { GitHubIcon, GoogleIcon } from '../components/OAuthIcons';
import { useOAuth } from '../hooks/useOAuth';

function getPasswordStrength(pw: string): { label: string; color: string; percent: number } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { label: 'Weak', color: 'bg-red-500', percent: 20 };
  if (score <= 2) return { label: 'Fair', color: 'bg-yellow-500', percent: 40 };
  if (score <= 3) return { label: 'Good', color: 'bg-blue-500', percent: 60 };
  if (score <= 4) return { label: 'Strong', color: 'bg-green-500', percent: 80 };
  return { label: 'Very strong', color: 'bg-green-400', percent: 100 };
}

export default function Signup() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { handleOAuth, oauthLoading, oauthError } = useOAuth();
  useEffect(() => {
    if (oauthError) {
      setError(oauthError);
    }
  }, [oauthError]);
  const [emailSent, setEmailSent] = useState(false);

  const passwordChecks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
  ];
  const allChecksMet = passwordChecks.every((c) => c.met);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const strength = password.length > 0 ? getPasswordStrength(password) : null;

  const handleOAuthClick = async (provider: 'github' | 'google') => {
    setError(null);
    await handleOAuth(provider);
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!allChecksMet) {
      setError('Please meet all password requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login?confirmed=true${redirectTo !== '/dashboard' ? `&redirect=${encodeURIComponent(redirectTo)}` : ''}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError('An account with this email already exists.');
      setLoading(false);
      return;
    }

    setEmailSent(true);
    setLoading(false);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-bg text-text-main font-sans flex flex-col justify-center py-12 px-4">
        <div className="mx-auto w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Check className="w-7 h-7 text-accent" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">Check your email</h2>
          <p className="text-text-muted mb-1">
            We sent a confirmation link to
          </p>
          <p className="font-medium mb-6">{email}</p>
          <p className="text-text-muted text-sm mb-8">
            Click the link in the email to activate your account, then sign in.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans flex flex-col justify-center py-12 px-4">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="flex justify-center mb-8">
          <RelayIcon size={40} className="text-text-main" />
        </Link>
        <h2 className="text-center text-2xl font-bold tracking-tight mb-1">
          Create your account
        </h2>
        <p className="text-center text-sm text-text-muted mb-8">
          <Link to="/" className="text-accent hover:text-emerald-600 transition-colors">
            Back to home
          </Link>
        </p>

        <div className="bg-surface rounded-2xl border border-border p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* OAuth */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleOAuthClick('google')}
              disabled={loading || !!oauthLoading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-bg py-2.5 px-4 text-sm font-medium text-text-main hover:bg-surface-hover transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {oauthLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
            </button>
            <button
              type="button"
              onClick={() => handleOAuthClick('github')}
              disabled={loading || !!oauthLoading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-bg py-2.5 px-4 text-sm font-medium text-text-main hover:bg-surface-hover transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'github' ? (
                <div className="w-5 h-5 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
              ) : (
                <GitHubIcon />
              )}
              {oauthLoading === 'github' ? 'Connecting...' : 'Continue with GitHub'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-surface px-3 text-text-muted">or</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSignup}>
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
              <label className="block text-sm font-medium text-text-muted mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm placeholder-text-muted/50 focus:border-accent focus:outline-none transition-colors"
              />
              {strength && (
                <div className="mt-2">
                  <div className="h-1 w-full bg-surface-hover rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: `${strength.percent}%` }}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${strength.percent <= 40 ? 'text-red-400' : 'text-text-muted'}`}>
                    {strength.label}
                  </p>
                </div>
              )}
              {password.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {passwordChecks.map((check, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs">
                      {check.met ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-text-muted/50" />
                      )}
                      <span className={check.met ? 'text-green-500' : 'text-text-muted/70'}>
                        {check.label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm placeholder-text-muted/50 focus:border-accent focus:outline-none transition-colors"
              />
              {confirmPassword.length > 0 && (
                <p className={`text-xs mt-1.5 flex items-center gap-1.5 ${passwordsMatch ? 'text-green-500' : 'text-red-400'}`}>
                  {passwordsMatch ? (
                    <><Check className="w-3.5 h-3.5" /> Passwords match</>
                  ) : (
                    <><X className="w-3.5 h-3.5" /> Passwords do not match</>
                  )}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !allChecksMet || !passwordsMatch}
              className="flex w-full justify-center rounded-lg bg-accent py-2.5 px-4 text-sm font-medium text-white hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Sign in link */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-accent hover:text-emerald-600 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
