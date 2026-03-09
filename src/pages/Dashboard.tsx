import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Trash2, Plus, Settings, CreditCard, AlertCircle, Copy, Check, ExternalLink, UserX, Bell, Zap, Webhook } from 'lucide-react';
import { RelayIcon } from '../components/RelayLogo';
import { ThemeToggle } from '../components/ThemeToggle';

const FREE_APP_LIMIT = 3;
const FREE_NOTIFICATION_LIMIT = 100;
const FREE_HISTORY_LIMIT = 10;
const PRO_HISTORY_LIMIT = 50;

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.floor(diffDay / 30);
  return `${diffMo}mo ago`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateWebhookToken(): string {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi?.getRandomValues) {
    throw new Error('Secure token generation is unavailable in this browser.');
  }

  const bytes = new Uint8Array(32);
  cryptoApi.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

interface UserData {
  id: string;
  email: string;
  plan: 'free' | 'pro';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_interval: 'month' | 'year' | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface Dashboard {
  id: string;
  name: string;
  url: string;
  webhook_token: string;
  icon: string | null;
}

interface NotificationRecord {
  id: string;
  app_id: string | null;
  title: string;
  body: string | null;
  created_at: string;
  read_at: string | null;
  event_type: string | null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [provisioningProfile, setProvisioningProfile] = useState(false);
  const [notificationsUsed, setNotificationsUsed] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingDashboardId, setDeletingDashboardId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newDashName, setNewDashName] = useState('');
  const [newDashUrl, setNewDashUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deleteDashboardError, setDeleteDashboardError] = useState<string | null>(null);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; status: 'success' | 'error' } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationRecord[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const fetchData = async (allowProfileRetry = true): Promise<void> => {
      const { data: { session } } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (!session) {
        navigate('/login');
        return;
      }

      // Check for Stripe success redirect
      const params = new URLSearchParams(window.location.search);
      const hasCheckoutSessionRedirect = Boolean(params.get('session_id'));
      if (hasCheckoutSessionRedirect) {
        setShowSuccess(false);
        window.history.replaceState({}, '', '/dashboard');
      }

      const fetchProfile = () => supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      let { data: userData, error: profileError } = await fetchProfile();

      if (cancelled) {
        return;
      }

      if (profileError) {
        console.error('Failed to load profile:', profileError);
        setUser(null);
        setFetchError('We couldn\'t load your account. Please try again.');
        return;
      }

      if (!userData) {
        if (session.user.email) {
          fetch('/api/send-welcome', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({}),
          }).catch(() => {});
        }

        if (allowProfileRetry) {
          setProvisioningProfile(true);
          await sleep(1500);

          if (cancelled) {
            return;
          }

          setProvisioningProfile(false);
          return fetchData(false);
        }

        setUser(null);
        setFetchError('Your account is still being provisioned. Please try again.');
        return;
      }

      if (hasCheckoutSessionRedirect && userData.plan !== 'pro') {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          await sleep(2000);

          if (cancelled) {
            return;
          }

          const profileRetry = await fetchProfile();

          if (profileRetry.error) {
            console.error('Failed to confirm upgraded profile state:', profileRetry.error);
            setUser(null);
            setFetchError('We couldn\'t confirm your updated billing status. Please try again.');
            return;
          }

          if (profileRetry.data) {
            userData = profileRetry.data;

            if (userData.plan === 'pro') {
              break;
            }
          }
        }
      }

      setUser(userData);

      if (hasCheckoutSessionRedirect && userData.plan === 'pro') {
        setShowSuccess(true);
      }

      const historyLimit = userData.plan === 'pro' ? PRO_HISTORY_LIMIT : FREE_HISTORY_LIMIT;

      const [dashboardsResult, notificationsResult, historyResult] = await Promise.all([
        supabase
          .from('apps')
          .select('*')
          .eq('user_id', session.user.id),
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .gte('created_at', new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString()),
        supabase
          .from('notifications')
          .select('id, app_id, title, body, created_at, read_at, event_type')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(historyLimit),
      ]);

      if (cancelled) {
        return;
      }

      let nextFetchError: string | null = null;

      if (dashboardsResult.error) {
        console.error('Failed to load dashboards:', dashboardsResult.error);
        nextFetchError = 'We couldn\'t load your dashboards. Please try again.';
      } else {
        setDashboards(dashboardsResult.data || []);
      }

      if (notificationsResult.error) {
        console.error('Failed to load notification usage:', notificationsResult.error);
        nextFetchError = nextFetchError || 'We couldn\'t load your notification usage. Please try again.';
      } else {
        setNotificationsUsed(notificationsResult.count || 0);
      }

      if (historyResult.error) {
        console.error('Failed to load notification history:', historyResult.error);
      } else {
        setRecentNotifications(historyResult.data || []);
      }

      setFetchError(nextFetchError);
    };

    setLoading(true);
    setFetchError(null);
    setProvisioningProfile(false);

    fetchData()
      .catch((fetchErr) => {
        if (cancelled) {
          return;
        }

        console.error('Unexpected dashboard load error:', fetchErr);
        setFetchError('We couldn\'t load your dashboard. Please try again.');
      })
      .finally(() => {
        if (!cancelled) {
          setProvisioningProfile(false);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, reloadKey]);

  const handleRetryFetch = () => {
    setFetchError(null);
    setDeleteDashboardError(null);
    setReloadKey((current) => current + 1);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setDeleting(true);
    setDeleteAccountError(null);
    try {
      const { error: deleteError } = await supabase.functions.invoke('delete-account', {
        body: {
          confirmation: 'DELETE MY ACCOUNT',
        },
      });
      if (deleteError) throw deleteError;

      await supabase.auth.signOut();
      navigate('/');
    } catch (err: any) {
      console.error('Failed to delete account', err);
      setDeleteAccountError(err.message || 'Failed to delete account. Please try again or contact support.');
      setDeleting(false);
    }
  };

  const handleCopyToken = async (token: string) => {
    await navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleTestWebhook = async (app: Dashboard) => {
    setTestingId(app.id);
    setTestResult(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify/${app.webhook_token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Test notification', body: 'Your webhook is working!' }),
        },
      );
      setTestResult({ id: app.id, status: response.ok ? 'success' : 'error' });
    } catch {
      setTestResult({ id: app.id, status: 'error' });
    } finally {
      setTestingId(null);
      setTimeout(() => setTestResult(null), 2000);
    }
  };

  const handleAddDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setFetchError(null);

    if (user.plan === 'free' && dashboards.length >= FREE_APP_LIMIT) {
      setError(`Free plan is limited to ${FREE_APP_LIMIT} dashboards. Please upgrade to add more.`);
      return;
    }

    let token: string;

    try {
      token = generateWebhookToken();
    } catch (tokenError: any) {
      setError(tokenError.message || 'Failed to generate a secure webhook token.');
      return;
    }

    const { data, error: insertError } = await supabase
      .from('apps')
      .insert([
        {
          user_id: user.id,
          name: newDashName,
          url: newDashUrl,
          webhook_token: token,
        },
      ])
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      setDashboards([...dashboards, data]);
      setShowAddModal(false);
      setNewDashName('');
      setNewDashUrl('');
      setError(null);
    }
  };

  const handleDeleteDashboard = async (id: string) => {
    setDeleteDashboardError(null);
    setDeletingDashboardId(id);

    const { error: deleteError } = await supabase.from('apps').delete().eq('id', id);

    if (deleteError) {
      console.error('Failed to delete dashboard:', deleteError);
      setDeleteDashboardError(deleteError.message || 'Failed to delete dashboard. Please try again.');
      setDeletingDashboardId(null);
      return;
    }

    setDashboards((currentDashboards) => currentDashboards.filter((dashboard) => dashboard.id !== id));
    setDeletingDashboardId(null);
  };

  const handleManageBilling = async () => {
    if (!user?.stripe_customer_id) {
      navigate('/pricing');
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('/api/create-billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to open billing portal');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err: any) {
      console.error('Failed to open billing portal', err);
      alert(err.message || 'Failed to open billing portal. Please try again.');
    }
  };

  const notificationLimit = user?.plan === 'pro' ? 10000 : FREE_NOTIFICATION_LIMIT;
  const notificationPercent = Math.min((notificationsUsed / notificationLimit) * 100, 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text-main flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-muted">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          Loading your dashboards...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg text-text-main flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Account Error</h2>
        <p className="text-text-muted mb-8 max-w-sm">
          We couldn't load your profile. This usually happens if there was a problem with your signup or login session.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-lg bg-surface border border-border text-sm font-medium hover:bg-surface-hover transition-all cursor-pointer"
          >
            Retry
          </button>
          <button
            onClick={handleSignOut}
            className="px-6 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-all cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (provisioningProfile) {
    return (
      <div className="min-h-screen bg-bg text-text-main flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Setting up your account…</h2>
          <p className="text-sm text-text-muted">
            We&apos;re provisioning your profile after sign-in. This should only take a moment.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg text-text-main flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-surface border border-red-500/20 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Unable to load your dashboard</h2>
          <p className="text-sm text-text-muted mb-6">
            {fetchError || 'We couldn\'t load your account. Please try again.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRetryFetch}
              className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-emerald-600 transition-all cursor-pointer"
            >
              Retry
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-text-muted hover:text-text-main transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
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
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted hidden sm:block">{user?.email}</span>
            <ThemeToggle />
            <button onClick={handleSignOut} className="text-sm font-medium text-text-muted hover:text-text-main transition-colors cursor-pointer">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {showSuccess && (
          <div className="mb-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-500">Welcome to Pro!</h3>
                <p className="text-sm text-emerald-500/80">Your account has been upgraded successfully. You now have unlimited dashboards and higher limits.</p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-emerald-500 hover:text-emerald-600 p-2 cursor-pointer"
            >
              <Trash2 className="w-5 h-5 opacity-50" />
            </button>
          </div>
        )}
        {fetchError && (
          <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-500">Dashboard data failed to load</h3>
                <p className="text-sm text-red-500/80">{fetchError}</p>
              </div>
            </div>
            <button
              onClick={handleRetryFetch}
              className="px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-8">

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-text-muted" />
                Account
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-muted mb-1">Email</p>
                  <p className="font-medium text-sm">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1">Plan</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                      user?.plan === 'pro'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-surface-hover text-text-muted'
                    }`}>
                      {user?.plan}
                    </span>
                    {user?.plan === 'free' && (
                      <Link to="/pricing" className="text-xs text-accent hover:text-emerald-600 font-medium transition-colors">
                        Upgrade
                      </Link>
                    )}
                  </div>
                  {user?.plan === 'free' && (
                    <div className="mt-3 bg-accent/5 border border-accent/20 rounded-xl p-3">
                      <p className="text-xs text-text-muted leading-relaxed mb-2">
                        Free plan: <span className="text-text-main font-medium">3 apps, 1 device, 100 notifications/month.</span> Upgrade for unlimited apps, up to 10 devices, and 10k notifications.
                      </p>
                      <Link
                        to="/pricing"
                        className="inline-flex items-center justify-center w-full h-8 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-emerald-600 transition-all"
                      >
                        Upgrade to Pro
                      </Link>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-2">Notifications this month</p>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium">{notificationsUsed.toLocaleString()}</span>
                    <span className="text-text-muted">{notificationLimit.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${notificationPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <button
                  onClick={handleManageBilling}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-surface-hover border border-border text-sm font-medium hover:bg-bg transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  Manage Billing
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-red-500/5 border border-red-500/10 text-sm font-medium text-red-500/70 hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer mt-2"
                >
                  <UserX className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Your Dashboards</h1>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 h-10 px-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-emerald-600 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Dashboard
              </button>
            </div>

            {deleteDashboardError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{deleteDashboardError}</p>
              </div>
            )}

            {dashboards.length === 0 ? (
              <div className="bg-surface border border-dashed border-border rounded-2xl p-12 text-center max-w-2xl mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                  <Webhook className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Add your first app</h3>
                <p className="text-text-muted mb-8 text-sm max-w-md mx-auto leading-relaxed">
                  Relay saves your dashboards and tools, gives each one a webhook URL, and sends push notifications
                  when something important happens.
                </p>
                <div className="grid sm:grid-cols-3 gap-3 text-left mb-8">
                  <div className="rounded-xl border border-border bg-bg p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-1">1</p>
                    <p className="text-sm font-medium mb-1">Add a dashboard</p>
                    <p className="text-xs text-text-muted">Save any internal tool, monitoring view, or web app you want to launch quickly.</p>
                  </div>
                  <div className="rounded-xl border border-border bg-bg p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-1">2</p>
                    <p className="text-sm font-medium mb-1">Copy the webhook</p>
                    <p className="text-xs text-text-muted">Each app gets its own webhook URL so you can trigger alerts from scripts and automations.</p>
                  </div>
                  <div className="rounded-xl border border-border bg-bg p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-1">3</p>
                    <p className="text-sm font-medium mb-1">Receive notifications</p>
                    <p className="text-xs text-text-muted">Tap the push to jump straight into the exact dashboard that needs your attention.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-emerald-600 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add your first app
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboards.map((dash) => (
                  <div key={dash.id} className="bg-surface border border-border rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-lg mb-1">{dash.name}</h3>
                      <a href={dash.url} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline mb-3 inline-flex items-center gap-1">
                        {dash.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-xs text-text-muted font-mono bg-bg px-2.5 py-1.5 rounded-lg border border-border truncate max-w-[240px]">
                          {dash.webhook_token}
                        </code>
                        <button
                          onClick={() => handleCopyToken(dash.webhook_token)}
                          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-main transition-colors cursor-pointer shrink-0"
                        >
                          {copiedToken === dash.webhook_token ? (
                            <><Check className="w-3.5 h-3.5 text-accent" /> Copied</>
                          ) : (
                            <><Copy className="w-3.5 h-3.5" /> Copy</>
                          )}
                        </button>
                        <button
                          onClick={() => handleTestWebhook(dash)}
                          disabled={testingId === dash.id}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border bg-bg text-xs text-text-muted hover:text-text-main hover:bg-surface-hover transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {testingId === dash.id ? (
                            <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Testing</>
                          ) : testResult?.id === dash.id && testResult.status === 'success' ? (
                            <><Check className="w-3.5 h-3.5 text-emerald-500" /> <span className="text-emerald-500">Sent!</span></>
                          ) : testResult?.id === dash.id && testResult.status === 'error' ? (
                            <><Zap className="w-3.5 h-3.5 text-red-500" /> <span className="text-red-500">Failed</span></>
                          ) : (
                            <><Zap className="w-3.5 h-3.5" /> Test</>
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDashboard(dash.id)}
                      disabled={deletingDashboardId === dash.id}
                      className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all self-start sm:self-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingDashboardId === dash.id ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Notifications */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Bell className="w-5 h-5 text-text-muted" />
                  Recent Notifications
                </h2>
                {user.plan === 'pro' && (
                  <span className="text-xs text-text-muted">Last {PRO_HISTORY_LIMIT}</span>
                )}
              </div>

              {recentNotifications.length === 0 ? (
                <div className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center">
                  <Bell className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-30" />
                  <h3 className="text-base font-medium mb-1">No notifications yet</h3>
                  <p className="text-text-muted text-sm">Notifications sent to your dashboards will appear here.</p>
                </div>
              ) : (
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                  <div className="divide-y divide-border">
                    {recentNotifications.map((notif) => {
                      const appName = dashboards.find((d) => d.id === notif.app_id)?.name ?? 'Unknown app';
                      const truncatedBody = notif.body && notif.body.length > 120
                        ? `${notif.body.slice(0, 120)}\u2026`
                        : (notif.body ?? '');
                      return (
                        <div key={notif.id} className="px-5 py-4 flex items-start gap-4 hover:bg-surface-hover transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Bell className="w-4 h-4 text-accent" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-3 mb-0.5">
                              <p className="text-sm font-semibold truncate">{notif.title}</p>
                              <span className="text-xs text-text-muted shrink-0 tabular-nums">{timeAgo(notif.created_at)}</span>
                            </div>
                            {truncatedBody && (
                              <p className="text-sm text-text-muted leading-relaxed">{truncatedBody}</p>
                            )}
                            <p className="text-xs text-text-muted mt-1 opacity-70">{appName}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {user.plan === 'free' && (
                    <div className="px-5 py-4 border-t border-border bg-surface-hover flex items-center justify-between gap-4">
                      <p className="text-sm text-text-muted">
                        Showing the last {FREE_HISTORY_LIMIT} notifications.
                      </p>
                      <Link
                        to="/pricing"
                        className="text-sm font-medium text-accent hover:text-emerald-600 transition-colors shrink-0"
                      >
                        See full history with Pro
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Dashboard Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold">Add Dashboard</h2>
            </div>
            <form onSubmit={handleAddDashboard} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Name</label>
                <input
                  type="text"
                  required
                  value={newDashName}
                  onChange={(e) => setNewDashName(e.target.value)}
                  placeholder="e.g. Production Grafana"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">URL</label>
                <input
                  type="url"
                  required
                  value={newDashUrl}
                  onChange={(e) => setNewDashUrl(e.target.value)}
                  placeholder="https://grafana.example.com"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setError(null);
                  }}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-main transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-emerald-600 transition-all cursor-pointer"
                >
                  Save Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-red-500">Delete Account</h2>
            </div>
            <div className="p-6 space-y-4">
              {deleteAccountError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{deleteAccountError}</p>
                </div>
              )}
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">This action is permanent</p>
                  <p className="opacity-80">All your dashboards, apps, and notification history will be deleted immediately. Active Pro subscriptions will be cancelled.</p>
                </div>
              </div>
              <p className="text-text-muted text-sm px-1">
                Are you sure you want to delete your account? You cannot undo this.
              </p>
              <div className="pt-4 flex flex-col gap-3">
                <button
                  disabled={deleting}
                  onClick={handleDeleteAccount}
                  className="w-full h-11 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {deleting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting account...</>
                  ) : (
                    'Yes, delete my account'
                  )}
                </button>
                <button
                  disabled={deleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full h-11 rounded-lg border border-border text-sm font-medium text-text-muted hover:text-text-main hover:bg-surface-hover transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
