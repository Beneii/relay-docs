import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { supabase } from '../lib/supabase';
import { RelayIcon } from '../components/RelayLogo';
import { getPasswordStrength } from '../lib/passwordStrength';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordChecks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
  ];
  const allChecksMet = passwordChecks.every((c) => c.met);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const strength = password.length > 0 ? getPasswordStrength(password) : null;

  useEffect(() => {
    let active = true;

    const initializeRecovery = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'recovery' && accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            if (active) {
              setError('This password reset link is invalid or expired. Request a new one from login.');
              setRecoveryReady(false);
              setCheckingLink(false);
            }
            return;
          }

          window.history.replaceState(null, '', window.location.pathname);

          if (active) {
            setRecoveryReady(true);
            setCheckingLink(false);
          }
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (session) {
          setRecoveryReady(true);
        } else {
          setError('This password reset link is invalid or expired. Request a new one from login.');
          setRecoveryReady(false);
        }

        setCheckingLink(false);
      } catch {
        if (!active) {
          return;
        }

        setError('Unable to verify your password reset link. Please request a new one.');
        setRecoveryReady(false);
        setCheckingLink(false);
      }
    };

    initializeRecovery();

    return () => {
      active = false;
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allChecksMet) {
      setError('Please meet all password requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut().catch(() => {});
    setSuccess(true);
    setLoading(false);
  };

  if (checkingLink) {
    return (
      <div className="min-h-screen bg-bg text-text-main font-sans flex flex-col justify-center py-12 px-4">
        <div className="mx-auto w-full max-w-md text-center">
          <Link to="/" className="flex justify-center mb-8">
            <RelayIcon size={40} className="text-text-main" />
          </Link>
          <div className="bg-surface rounded-2xl border border-border p-8">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-sm text-text-muted">Checking your reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg text-text-main font-sans flex flex-col justify-center py-12 px-4">
        <div className="mx-auto w-full max-w-md text-center">
          <Link to="/" className="flex justify-center mb-8">
            <RelayIcon size={40} className="text-text-main" />
          </Link>
          <div className="bg-surface rounded-2xl border border-border p-8">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Check className="w-7 h-7 text-accent" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-3">Password updated</h2>
            <p className="text-sm text-text-muted mb-8 leading-relaxed">
              Your password has been reset successfully. You can now sign in with your new credentials.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 h-11 px-8 rounded-lg bg-accent text-white font-medium hover:bg-blue-600 transition-all w-full shadow-lg shadow-accent/10"
            >
              Go to sign in
            </Link>
          </div>
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
          Reset your password
        </h2>
        <p className="text-center text-sm text-text-muted mb-8">
          <Link to="/login" className="text-accent hover:text-emerald-600 transition-colors">
            Back to sign in
          </Link>
        </p>

        <div className="bg-surface rounded-2xl border border-border p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {!recoveryReady ? (
            <div className="text-center">
              <p className="text-sm text-text-muted mb-8 leading-relaxed">
                This reset link is no longer valid. Request a new password reset email from the login page.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg border border-border text-text-main text-sm font-medium hover:bg-surface-hover transition-all w-full"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                  New password
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
                  Confirm new password
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
                className="flex w-full justify-center rounded-lg bg-accent py-2.5 px-4 text-sm font-medium text-white hover:bg-blue-600 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? 'Updating password...' : 'Set new password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
