import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Zap, Check } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justConfirmed = searchParams.get('confirmed') === 'true';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === 'Email not confirmed') {
        setError('Please check your email and click the confirmation link before signing in.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent" />
          </div>
        </Link>
        <h2 className="text-center text-3xl font-bold tracking-tight text-text-main">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-text-muted">
          <Link to="/" className="text-accent hover:text-blue-400 transition-colors">
            Back to home
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
          {justConfirmed && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-md text-sm mb-6 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              Email confirmed! You can now sign in.
            </div>
          )}
          <form className="space-y-6" onSubmit={handleLogin}>
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
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-text-main py-2 px-4 text-sm font-medium text-bg shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
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
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/signup"
                className="flex w-full justify-center rounded-md border border-border bg-bg py-2 px-4 text-sm font-medium text-text-main shadow-sm hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
