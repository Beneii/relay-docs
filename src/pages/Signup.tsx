import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Check, X } from 'lucide-react';
import { RelayIcon } from '../components/RelayLogo';

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const passwordChecks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
  ];
  const allChecksMet = passwordChecks.every((c) => c.met);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const strength = password.length > 0 ? getPasswordStrength(password) : null;

  const handleOAuth = async (provider: 'github' | 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login?confirmed=true`,
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

    if (data.user) {
      await supabase.from('profiles').upsert([
        {
          id: data.user.id,
          email: data.user.email,
        },
      ], { onConflict: 'id' });

      fetch('/api/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.user.email, userId: data.user.id }),
      }).catch(() => {});
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
              onClick={() => handleOAuth('google')}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-bg py-2.5 px-4 text-sm font-medium text-text-main hover:bg-surface-hover transition-all cursor-pointer"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('github')}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-bg py-2.5 px-4 text-sm font-medium text-text-main hover:bg-surface-hover transition-all cursor-pointer"
            >
              <GitHubIcon />
              Continue with GitHub
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
