import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Zap } from 'lucide-react';

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

    // If no profile loaded, check if there's a session directly
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

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setUpgradeError(data.error || 'Failed to create checkout session.');
      }
    } catch (error: any) {
      setUpgradeError(error.message || 'Something went wrong.');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-bg text-text-main flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans">
      <nav className="border-b border-border bg-surface/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center">
              <Zap className="w-4 h-4 text-accent" />
            </div>
            <span className="font-semibold tracking-tight">Relay</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard" className="text-sm font-medium text-text-muted hover:text-text-main">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-text-muted hover:text-text-main">
                  Sign in
                </Link>
                <Link to="/signup" className="h-9 px-4 rounded-md bg-text-main text-bg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center">
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

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link 
              to={user ? "/dashboard" : "/signup"}
              className="w-full flex justify-center items-center h-12 rounded-lg bg-bg border border-border text-text-main font-medium hover:bg-surface-hover transition-colors"
            >
              {user ? 'Go to Dashboard' : 'Get Started'}
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-surface border-2 border-accent rounded-2xl p-8 flex flex-col relative shadow-[0_0_40px_rgba(59,130,246,0.1)]">
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
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {upgradeError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md text-sm mb-4">
                {upgradeError}
              </div>
            )}
            <button
              onClick={handleUpgrade}
              disabled={user?.plan === 'pro'}
              className="w-full flex justify-center items-center h-12 rounded-lg bg-accent text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {user?.plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
