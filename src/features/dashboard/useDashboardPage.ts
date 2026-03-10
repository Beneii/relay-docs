import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { NOTIFICATION_HISTORY_LIMITS, getLimits } from "@shared/product";

import { supabase } from "../../lib/supabase";
import {
  Dashboard,
  DashboardMember,
  DashboardTestResult,
  DashboardWithSharing,
  DeviceRecord,
  NotificationRecord,
  UserData,
} from "./types";
import { generateWebhookToken, sleep } from "./utils";

export function useDashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [dashboards, setDashboards] = useState<DashboardWithSharing[]>([]);
  const [members, setMembers] = useState<Record<string, DashboardMember[]>>({});
  const [showMembersModal, setShowMembersModal] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [provisioningProfile, setProvisioningProfile] = useState(false);
  const [notificationsUsed, setNotificationsUsed] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingDashboardId, setDeletingDashboardId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newDashName, setNewDashName] = useState("");
  const [newDashUrl, setNewDashUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deleteDashboardError, setDeleteDashboardError] = useState<string | null>(null);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteAccountConfirmation] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<DashboardTestResult | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationRecord[]>([]);
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const fetchData = async (allowProfileRetry = true): Promise<void> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (!session) {
        navigate("/login");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const hasCheckoutSessionRedirect = Boolean(params.get("session_id"));
      if (hasCheckoutSessionRedirect) {
        setShowSuccess(false);
        window.history.replaceState({}, "", "/dashboard");
      }

      const fetchProfile = () =>
        supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();

      let { data: userData, error: profileError } = await fetchProfile();

      if (cancelled) {
        return;
      }

      if (profileError) {
        console.error("Failed to load profile:", profileError);
        setUser(null);
        setFetchError("We couldn't load your account. Please try again.");
        return;
      }

      if (!userData) {
        if (session.user.email) {
          fetch("/api/send-welcome", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
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
        setFetchError("Your account is still being provisioned. Please try again.");
        return;
      }

      if (hasCheckoutSessionRedirect && userData.plan !== "pro") {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          await sleep(2000);

          if (cancelled) {
            return;
          }

          const profileRetry = await fetchProfile();

          if (profileRetry.error) {
            console.error("Failed to confirm upgraded profile state:", profileRetry.error);
            setUser(null);
            setFetchError("We couldn't confirm your updated billing status. Please try again.");
            return;
          }

          if (profileRetry.data) {
            userData = profileRetry.data;

            if (userData.plan === "pro") {
              break;
            }
          }
        }
      }

      setUser(userData);

      if (hasCheckoutSessionRedirect && userData.plan === "pro") {
        setShowSuccess(true);
      }

      const historyLimit = NOTIFICATION_HISTORY_LIMITS[userData.plan];

      const [dashboardsResult, sharedMembershipsResult, notificationsResult, historyResult, devicesResult] = await Promise.all([
        supabase.from("apps").select("*"),
        supabase
          .from("dashboard_members")
          .select("app_id, role")
          .eq("user_id", session.user.id)
          .eq("status", "accepted"),
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .gte(
            "created_at",
            new Date(
              Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)
            ).toISOString()
          ),
        supabase
          .from("notifications")
          .select(
            "id, app_id, title, body, created_at, read_at, event_type, severity, channel, pushed_count, actions_json"
          )
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(historyLimit),
        supabase
          .from("devices")
          .select("id, platform, created_at, updated_at")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) {
        return;
      }

      let nextFetchError: string | null = null;

      if (dashboardsResult.error) {
        console.error("Failed to load dashboards:", dashboardsResult.error);
        nextFetchError = "We couldn't load your dashboards. Please try again.";
      } else {
        const allApps: Dashboard[] = dashboardsResult.data || [];
        const membershipMap = new Map(
          (sharedMembershipsResult.data || []).map((m) => [m.app_id, m.role as "viewer" | "editor"])
        );

        // For non-owned apps, fetch owner emails
        const nonOwnedOwnerIds = [...new Set(
          allApps
            .filter((a) => a.user_id !== session.user.id)
            .map((a) => a.user_id)
        )];
        const ownerEmailMap = new Map<string, string>();
        if (nonOwnedOwnerIds.length > 0) {
          const { data: ownerProfiles } = await supabase
            .from("profiles")
            .select("id, email")
            .in("id", nonOwnedOwnerIds);
          (ownerProfiles || []).forEach((p: { id: string; email: string }) => {
            ownerEmailMap.set(p.id, p.email);
          });
        }

        const enriched: DashboardWithSharing[] = allApps.map((app) => ({
          ...app,
          is_owner: app.user_id === session.user.id,
          owner_email: app.user_id !== session.user.id ? ownerEmailMap.get(app.user_id) : undefined,
          member_role: membershipMap.get(app.id),
        }));
        setDashboards(enriched);
      }

      if (notificationsResult.error) {
        console.error("Failed to load notification usage:", notificationsResult.error);
        nextFetchError =
          nextFetchError || "We couldn't load your notification usage. Please try again.";
      } else {
        setNotificationsUsed(notificationsResult.count || 0);
      }

      if (historyResult.error) {
        console.error("Failed to load notification history:", historyResult.error);
      } else {
        setRecentNotifications(historyResult.data || []);
      }

      if (!devicesResult.error) {
        setDevices(devicesResult.data || []);
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

        console.error("Unexpected dashboard load error:", fetchErr);
        setFetchError("We couldn't load your dashboard. Please try again.");
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
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    setDeleting(true);
    setDeleteAccountError(null);
    try {
      const { error: deleteError } = await supabase.functions.invoke("delete-account", {
        body: {
          confirmation: "DELETE MY ACCOUNT",
        },
      });
      if (deleteError) throw deleteError;

      await supabase.auth.signOut();
      navigate("/");
    } catch (err: unknown) {
      console.error("Failed to delete account", err);
      setDeleteAccountError(
        err instanceof Error
          ? err.message
          : "Failed to delete account. Please try again or contact support."
      );
      setDeleting(false);
    }
  };

  const handleCopyToken = async (token: string) => {
    await navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleTestWebhook = async (dashboard: Dashboard) => {
    setTestingId(dashboard.id);
    setTestResult(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify/${dashboard.webhook_token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Test notification",
            body: "Your webhook is working!",
          }),
        }
      );
      setTestResult({ id: dashboard.id, status: response.ok ? "success" : "error" });
    } catch {
      setTestResult({ id: dashboard.id, status: "error" });
    } finally {
      setTestingId(null);
      setTimeout(() => setTestResult(null), 2000);
    }
  };

  const handleAddDashboard = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setFetchError(null);

    if (user.plan === "free" && dashboards.length >= getLimits("free").dashboards) {
      setError(
        `Free plan is limited to ${getLimits("free").dashboards} dashboards. Please upgrade to add more.`
      );
      return;
    }

    let token: string;

    try {
      token = generateWebhookToken();
    } catch (tokenError: unknown) {
      setError(
        tokenError instanceof Error
          ? tokenError.message
          : "Failed to generate a secure webhook token."
      );
      return;
    }

    const { data, error: insertError } = await supabase
      .from("apps")
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
      setNewDashName("");
      setNewDashUrl("");
      setError(null);
    }
  };

  const handleDeleteDashboard = async (id: string) => {
    setDeleteDashboardError(null);
    setDeletingDashboardId(id);

    const { error: deleteError } = await supabase.from("apps").delete().eq("id", id);

    if (deleteError) {
      console.error("Failed to delete dashboard:", deleteError);
      setDeleteDashboardError(
        deleteError.message || "Failed to delete dashboard. Please try again."
      );
      setDeletingDashboardId(null);
      return;
    }

    setDashboards((currentDashboards) =>
      currentDashboards.filter((dashboard) => dashboard.id !== id)
    );
    setDeletingDashboardId(null);
  };

  const handleRemoveDevice = async (id: string) => {
    await supabase.from("devices").delete().eq("id", id);
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  const fetchMembers = async (appId: string) => {
    const { data } = await supabase
      .from("dashboard_members")
      .select("id, email, role, status, created_at")
      .eq("app_id", appId)
      .order("created_at", { ascending: true });
    setMembers((prev) => ({ ...prev, [appId]: (data || []) as DashboardMember[] }));
  };

  const handleInviteMember = async (appId: string, email: string, role: string) => {
    setInviting(true);
    setInviteError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const res = await fetch("/api/invite-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ appId, email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");
      await fetchMembers(appId);
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, appId: string) => {
    await supabase.from("dashboard_members").delete().eq("id", memberId);
    setMembers((prev) => ({
      ...prev,
      [appId]: (prev[appId] || []).filter((m) => m.id !== memberId),
    }));
  };

  const handleManageBilling = async () => {
    if (!user?.stripe_customer_id) {
      navigate("/pricing");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("/api/create-billing-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to open billing portal");
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (err: unknown) {
      console.error("Failed to open billing portal", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to open billing portal. Please try again."
      );
    }
  };

  const activePlan = user?.plan ?? "free";
  const notificationLimit = getLimits(activePlan).notificationsPerMonth;
  const notificationHistoryLimit = NOTIFICATION_HISTORY_LIMITS[activePlan];
  const notificationPercent = Math.min(
    (notificationsUsed / notificationLimit) * 100,
    100
  );

  return {
    copiedToken,
    dashboards,
    fetchMembers,
    handleInviteMember,
    handleRemoveMember,
    inviteError,
    inviting,
    members,
    setInviteError,
    setShowMembersModal,
    showMembersModal,
    deleteAccountError,
    deleteConfirmation,
    deleteDashboardError,
    deleting,
    deletingDashboardId,
    error,
    fetchError,
    handleAddDashboard,
    handleCopyToken,
    handleDeleteAccount,
    handleDeleteDashboard,
    handleManageBilling,
    handleRemoveDevice,
    devices,
    handleRetryFetch,
    handleSignOut,
    handleTestWebhook,
    loading,
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
    setNewDashName,
    setNewDashUrl,
    setShowAddModal,
    setShowComposeModal,
    setShowDeleteModal,
    setShowSuccess,
    showAddModal,
    showComposeModal,
    showDeleteModal,
    showSuccess,
    testResult,
    testingId,
    user,
  };
}
