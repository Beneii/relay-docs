import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Zap, ArrowLeft, Check, X } from 'lucide-react';

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

    // If email confirmation is required, Supabase returns the user but
    // identities will be empty for an already-registered email
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError('An account with this email already exists.');
      setLoading(false);
      return;
    }

    // Create profile row (will succeed even if email isn't confirmed yet)
    if (data.user) {
      await supabase.from('profiles').upsert([
        {
          id: data.user.id,
          email: data.user.email,
        },
      ], { onConflict: 'id' });
    }

    setEmailSent(true);
    setLoading(false);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-bg text-text-main font-sans flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-accent" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">Check your email</h2>
          <p className="text-text-muted mb-2">
            We sent a confirmation link to
          </p>
          <p className="font-medium text-text-main mb-6">{email}</p>
          <p className="text-text-muted text-sm mb-8">
            Click the link in the email to activate your account, then sign in.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent" />
          </div>
        </Link>
        <h2 className="text-center text-3xl font-bold tracking-tight text-text-main">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-text-muted">
          <Link to="/" className="text-accent hover:text-blue-400 transition-colors">
            Back to home
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
          <form className="space-y-6" onSubmit={handleSignup}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text-muted">
                Email address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="block w-full appearance-none rounded-md border border-border bg-bg px-3 py-2 placeholder-text-muted/50 shadow-sm focus:border-accent focus:outline-none focus:ring-accent sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-border bg-bg px-3 py-2 placeholder-text-muted/50 shadow-sm focus:border-accent focus:outline-none focus:ring-accent sm:text-sm"
                />
              </div>
              {strength && (
                <div className="mt-2">
                  <div className="h-1 w-full bg-border rounded-full overflow-hidden">
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
              <label className="block text-sm font-medium text-text-muted">
                Confirm password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-border bg-bg px-3 py-2 placeholder-text-muted/50 shadow-sm focus:border-accent focus:outline-none focus:ring-accent sm:text-sm"
                />
              </div>
              {confirmPassword.length > 0 && (
                <p className={`text-xs mt-1 flex items-center gap-1.5 ${passwordsMatch ? 'text-green-500' : 'text-red-400'}`}>
                  {passwordsMatch ? (
                    <><Check className="w-3.5 h-3.5" /> Passwords match</>
                  ) : (
                    <><X className="w-3.5 h-3.5" /> Passwords do not match</>
                  )}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !allChecksMet || !passwordsMatch}
                className="flex w-full justify-center rounded-md border border-transparent bg-text-main py-2 px-4 text-sm font-medium text-bg shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-surface px-2 text-text-muted">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="flex w-full justify-center rounded-md border border-border bg-bg py-2 px-4 text-sm font-medium text-text-main shadow-sm hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
