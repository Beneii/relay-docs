import { Link } from "react-router-dom";
import { AlertCircle, Check, X } from "lucide-react";

import { RelayIcon } from "../components/RelayLogo";
import { ThemeToggle } from "../components/ThemeToggle";
import { AccountSidebar } from "../features/dashboard/AccountSidebar";
import { DashboardListSection } from "../features/dashboard/DashboardListSection";
import { RecentNotificationsPanel } from "../features/dashboard/RecentNotificationsPanel";
import { OnboardingBanner } from "../features/dashboard/OnboardingBanner";
import { ChannelPreferencesSection } from "../features/dashboard/ChannelPreferencesSection";
import { DevicesSection } from "../features/dashboard/DevicesSection";
import { ComposeNotificationModal } from "../features/dashboard/ComposeNotificationModal";
import { MembersModal } from "../features/dashboard/MembersModal";
import { AddDashboardModal, DeleteAccountModal } from "../features/dashboard/modals";
import { useDashboardPage } from "../features/dashboard/useDashboardPage";

export default function DashboardPage() {
  const {
    copiedToken,
    dashboards,
    deleteAccountError,
    deleteConfirmation,
    deleteDashboardError,
    deleting,
    deletingDashboardId,
    error,
    fetchError,
    fetchMembers,
    handleAddDashboard,
    handleCopyToken,
    devices,
    handleDeleteAccount,
    handleDeleteDashboard,
    handleInviteMember,
    handleManageBilling,
    handleRemoveDevice,
    handleRemoveMember,
    handleUpdateMemberRole,
    handleRetryFetch,
    handleSignOut,
    handleTestWebhook,
    inviteError,
    inviting,
    loading,
    members,
    newDashName,
    newDashUrl,
    notificationHistoryLimit,
    notificationLimit,
    notificationPercent,
    notificationsUsed,
    provisioningProfile,
    recentNotifications,
    setDeleteAccountConfirmation,
    setError,
    setInviteError,
    setNewDashName,
    setNewDashUrl,
    setShowAddModal,
    setShowComposeModal,
    setShowDeleteModal,
    setShowMembersModal,
    setShowSuccess,
    showAddModal,
    showComposeModal,
    showDeleteModal,
    showMembersModal,
    showSuccess,
    testResult,
    testingId,
    user,
  } = useDashboardPage();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text-main flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-muted">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Loading your dashboards...
        </div>
      </div>
    );
  }

  if (provisioningProfile) {
    return (
      <div className="min-h-screen bg-bg text-text-main flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Setting up your account…</h2>
          <p className="text-sm text-text-muted">
            We&apos;re provisioning your profile after sign-in. This should only take a
            moment.
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
            {fetchError || "We couldn't load your account. Please try again."}
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
            <span className="text-sm text-text-muted hidden sm:block">{user.email}</span>
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-text-muted hover:text-text-main transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {showSuccess ? (
          <div className="mb-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-500">Welcome to Pro!</h3>
                <p className="text-sm text-emerald-500/80">
                  Your account has been upgraded successfully. You now have unlimited
                  dashboards and higher limits.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-emerald-500 hover:text-emerald-600 p-2 cursor-pointer"
            >
              <X className="w-5 h-5 opacity-70" />
            </button>
          </div>
        ) : null}

        {fetchError ? (
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
        ) : null}

        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-6">
            <AccountSidebar
              notificationLimit={notificationLimit}
              notificationPercent={notificationPercent}
              notificationsUsed={notificationsUsed}
              onManageBilling={handleManageBilling}
              onShowDeleteModal={() => setShowDeleteModal(true)}
              user={user}
            />
            <DevicesSection
              devices={devices}
              user={user}
              onRemoveDevice={handleRemoveDevice}
            />
            <ChannelPreferencesSection userId={user.id} />
          </div>

          <div className="md:col-span-2 space-y-6">
            <OnboardingBanner
              dashboards={dashboards}
              notificationsUsed={notificationsUsed}
              onAddDashboard={() => setShowAddModal(true)}
              onTestWebhook={handleTestWebhook}
            />
            <DashboardListSection
              copiedToken={copiedToken}
              dashboards={dashboards}
              deleteDashboardError={deleteDashboardError}
              deletingDashboardId={deletingDashboardId}
              isPro={user.plan === "pro"}
              onCopyToken={handleCopyToken}
              onDeleteDashboard={handleDeleteDashboard}
              onShowAddModal={() => setShowAddModal(true)}
              onShowComposeModal={() => setShowComposeModal(true)}
              onShowMembersModal={(appId) => {
                setShowMembersModal(appId);
                setInviteError(null);
                fetchMembers(appId);
              }}
              onTestWebhook={handleTestWebhook}
              testResult={testResult}
              testingId={testingId}
            />

            <RecentNotificationsPanel
              dashboards={dashboards}
              notificationHistoryLimit={notificationHistoryLimit}
              recentNotifications={recentNotifications}
              user={user}
            />
          </div>
        </div>
      </main>

      {showAddModal ? (
        <AddDashboardModal
          error={error}
          name={newDashName}
          onClose={() => {
            setShowAddModal(false);
            setError(null);
          }}
          onNameChange={setNewDashName}
          onSubmit={handleAddDashboard}
          onUrlChange={setNewDashUrl}
          url={newDashUrl}
        />
      ) : null}

      {showComposeModal ? (
        <ComposeNotificationModal
          dashboards={dashboards}
          onClose={() => setShowComposeModal(false)}
        />
      ) : null}

      {showMembersModal ? (() => {
        const app = dashboards.find((d) => d.id === showMembersModal);
        if (!app) return null;
        return (
          <MembersModal
            appId={app.id}
            appName={app.name}
            isOwner={app.is_owner}
            isPro={user.plan === "pro"}
            members={members[app.id] || []}
            inviteError={inviteError}
            inviting={inviting}
            onInvite={handleInviteMember}
            onRemove={handleRemoveMember}
            onUpdateRole={handleUpdateMemberRole}
            onClose={() => setShowMembersModal(null)}
          />
        );
      })() : null}

      {showDeleteModal ? (
        <DeleteAccountModal
          confirmation={deleteConfirmation}
          deleting={deleting}
          error={deleteAccountError}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          onConfirmationChange={setDeleteAccountConfirmation}
        />
      ) : null}
    </div>
  );
}
