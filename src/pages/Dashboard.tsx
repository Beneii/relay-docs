import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Trash2, Plus, Settings, CreditCard, AlertCircle, Copy, Check, ExternalLink } from 'lucide-react';
import { RelayIcon } from '../components/RelayLogo';
import { ThemeToggle } from '../components/ThemeToggle';

interface UserData {
  id: string;
  email: string;
  plan: 'free' | 'pro';
  stripe_customer_id: string | null;
}

interface Dashboard {
  id: string;
  name: string;
  url: string;
  webhook_token: string;
  icon: string | null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationsUsed, setNotificationsUsed] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDashName, setNewDashName] = useState('');
  const [newDashUrl, setNewDashUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      let { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      // Auto-create profile for OAuth users (they skip the Signup page)
      if (!userData) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .upsert([{ id: session.user.id, email: session.user.email }], { onConflict: 'id' })
          .select()
          .single();
        userData = newProfile;

        // Send welcome email for new OAuth users (fire-and-forget)
        if (session.user.email) {
          fetch('/api/send-welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email, userId: session.user.id }),
          }).catch(() => {});
        }
      }

      if (userData) {
        setUser(userData);
      }

      const { data: dashData } = await supabase
        .from('apps')
        .select('*')
        .eq('user_id', session.user.id);

      if (dashData) {
        setDashboards(dashData);
      }

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      setNotificationsUsed(count || 0);
      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleCopyToken = async (token: string) => {
    await navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleAddDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (user.plan === 'free' && dashboards.length >= 1) {
      setError('Free plan is limited to 1 dashboard. Please upgrade to add more.');
      return;
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

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
    await supabase.from('apps').delete().eq('id', id);
    setDashboards(dashboards.filter((d) => d.id !== id));
  };

  const handleManageBilling = async () => {
    if (!user?.stripe_customer_id) {
      navigate('/pricing');
      return;
    }
    try {
      const response = await fetch('/api/create-billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: user.stripe_customer_id }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Failed to open billing portal', err);
    }
  };

  const notificationLimit = user?.plan === 'pro' ? 10000 : 200;
  const notificationPercent = Math.min((notificationsUsed / notificationLimit) * 100, 100);

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
                      <Link to="/pricing" className="text-xs text-accent hover:text-blue-600 font-medium transition-colors">
                        Upgrade
                      </Link>
                    )}
                  </div>
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
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Your Dashboards</h1>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 h-10 px-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-blue-600 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Dashboard
              </button>
            </div>

            {dashboards.length === 0 ? (
              <div className="bg-surface border border-dashed border-border rounded-2xl p-12 text-center">
                <LayoutDashboard className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-medium mb-2">No dashboards yet</h3>
                <p className="text-text-muted mb-6 text-sm">Add your first dashboard to get a webhook token.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-surface-hover border border-border text-sm font-medium hover:bg-bg transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Dashboard
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
                            <><Check className="w-3.5 h-3.5 text-green-500" /> Copied</>
                          ) : (
                            <><Copy className="w-3.5 h-3.5" /> Copy</>
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDashboard(dash.id)}
                      className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all self-start sm:self-center cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                  className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-blue-600 transition-all cursor-pointer"
                >
                  Save Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
