import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2, X } from 'lucide-react';
import { FREE_LIMITS, PRO_LIMITS } from '@shared/product';
import { LandingFooter } from '../features/landing/LandingFooter';
import { LandingNav } from '../features/landing/LandingNav';
import { MobileDownloadSection } from '../features/landing/MobileDownloadSection';
import { useMarketingNav } from '../features/landing/useMarketingNav';

interface UserProfile {
  id: string;
  email: string;
  plan: 'free' | 'pro';
  stripe_customer_id: string | null;
}

export default function Pricing() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [annual, setAnnual] = useState(false);
  const navigate = useNavigate();
  const { isSignedIn, mobileMenuOpen, navLogoRotate, setMobileMenuOpen } =
    useMarketingNav();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setError(true);
        } else {
          setUser(data);
        }
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

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ annual }),
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
    } catch (error: unknown) {
      setUpgradeError(error instanceof Error ? error.message : 'Something went wrong.');
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

  if (error) {
    return (
      <div className="min-h-screen bg-bg text-text-main flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Account error</h2>
        <p className="text-text-muted mb-8 max-w-sm">
          We couldn't load your profile. Please try refreshing the page or sign in again.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-lg bg-surface border border-border text-sm font-medium hover:bg-surface-hover transition-all cursor-pointer"
          >
            Retry
          </button>
          <Link
            to="/login"
            className="px-6 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-emerald-600 transition-all flex items-center"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const monthlyPrice = '$7.99';
  const annualPrice = '$79';
  const annualMonthly = '$6.58';
  const freePlanFeatures = [
    { label: `${FREE_LIMITS.dashboards} dashboards`, included: true },
    { label: `${FREE_LIMITS.devices} device`, included: true },
    { label: '500 notifications / month', included: true },
    { label: '@relayapp/sdk + REST API access', included: true },
    { label: 'Webhook API access', included: true },
    { label: `Up to ${PRO_LIMITS.devices} devices`, included: false },
    { label: 'Notification history', included: false },
    { label: 'Priority support', included: false },
  ];
  const proPlanFeatures = [
    'Unlimited dashboards & projects',
    `Up to ${PRO_LIMITS.devices} devices`,
    `${PRO_LIMITS.notificationsPerMonth.toLocaleString()} notifications per month`,
    'Interactive action buttons + SDK features',
    'Notification history & metadata events',
    'Priority support',
  ];

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans">
      <LandingNav
        anchorBasePath="/"
        isSignedIn={isSignedIn}
        mobileMenuOpen={mobileMenuOpen}
        navLogoRotate={navLogoRotate}
        onToggleMobileMenu={() => setMobileMenuOpen((isOpen) => !isOpen)}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Simple, transparent pricing</h1>
          <p className="text-xl text-text-muted mb-8">Start for free, upgrade when you need more power.</p>

          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!annual ? 'text-text-main' : 'text-text-muted'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              aria-label="Toggle annual billing"
              aria-pressed={annual}
              className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer ${annual ? 'bg-accent' : 'bg-border'}`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${annual ? 'left-6' : 'left-1'}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-text-main' : 'text-text-muted'}`}>
              Annual
              <span className="ml-1.5 text-xs font-semibold text-accent">Save 17%</span>
            </span>
          </div>
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
              {freePlanFeatures.map((feature, i) => (
                <li key={i} className={`flex items-start gap-3 ${!feature.included ? 'opacity-40' : ''}`}>
                  {feature.included ? (
                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${!feature.included ? 'line-through' : ''}`}>{feature.label}</span>
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
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold">{annual ? annualMonthly : monthlyPrice}</span>
              <span className="text-text-muted">/month</span>
            </div>
            {annual && (
              <p className="text-sm text-text-muted mb-6">Billed as {annualPrice}/year</p>
            )}
            {!annual && (
              <p className="text-sm text-text-muted mb-6">Billed monthly</p>
            )}
            <p className="text-text-muted mb-8">For power users and professional teams.</p>

            <ul className="space-y-4 mb-8 flex-1">
              {proPlanFeatures.map((feature, i) => (
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

        <MobileDownloadSection />
      </main>

      <LandingFooter anchorBasePath="/" />
    </div>
  );
}
