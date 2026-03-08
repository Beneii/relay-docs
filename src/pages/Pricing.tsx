import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2 } from 'lucide-react';
import { RelayIcon } from '../components/RelayLogo';
import { ThemeToggle } from '../components/ThemeToggle';

export default function Pricing() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUser(data);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setUpgradeError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    const userId = user?.id || session.user.id;
    const email = user?.email || session.user.email;

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, email }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setUpgradeError(errData.error || `Server error (${response.status})`);
        return;
      }
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setUpgradeError('No checkout URL returned. Please try again.');
      }
    } catch (error: any) {
      setUpgradeError(error.message || 'Something went wrong.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text-main flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-muted">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans">
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <RelayIcon size={24} className="text-text-main" />
            <span className="font-semibold tracking-tight">Relay</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard" className="text-sm font-medium text-text-muted hover:text-text-main transition-colors">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-text-muted hover:text-text-main transition-colors">
                  Sign in
                </Link>
                <Link to="/signup" className="h-9 px-4 rounded-lg bg-text-main text-bg text-sm font-medium hover:opacity-90 transition-all flex items-center">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Simple, transparent pricing</h1>
          <p className="text-xl text-text-muted">Start for free, upgrade when you need more power.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col">
            <h3 className="text-2xl font-semibold mb-2">Free</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-text-muted">/month</span>
            </div>
            <p className="text-text-muted mb-8">Perfect for personal projects and testing.</p>

            <ul className="space-y-4 mb-8 flex-1">
              {[
                '1 dashboard',
                '1 device',
                '200 notifications per month',
                'Webhook API access',
                'Community support'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              to={user ? "/dashboard" : "/signup"}
              className="w-full flex justify-center items-center h-12 rounded-lg border border-border text-text-main font-medium hover:bg-surface-hover transition-all"
            >
              {user ? 'Go to Dashboard' : 'Get Started'}
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-surface border-2 border-accent rounded-2xl p-8 flex flex-col relative">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <h3 className="text-2xl font-semibold mb-2">Pro</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold">$6</span>
              <span className="text-text-muted">/month</span>
            </div>
            <p className="text-text-muted mb-8">For power users and professional teams.</p>

            <ul className="space-y-4 mb-8 flex-1">
              {[
                'Unlimited dashboards',
                'Unlimited devices',
                '10,000 notifications per month',
                'Notification history',
                'Metadata events',
                'Priority support'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {upgradeError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4">
                {upgradeError}
              </div>
            )}
            <button
              onClick={handleUpgrade}
              disabled={user?.plan === 'pro'}
              className="w-full flex justify-center items-center h-12 rounded-lg bg-accent text-white font-medium hover:bg-emerald-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {user?.plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <RelayIcon size={18} className="text-text-muted" />
            <span className="text-text-muted text-sm">Relay — Real-time webhook notifications</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <Link to="/" className="hover:text-text-main transition-colors">Home</Link>
            <Link to="/pricing" className="hover:text-text-main transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
