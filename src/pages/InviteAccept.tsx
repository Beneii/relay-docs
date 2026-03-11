import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Check } from "lucide-react";

import { LoadingSpinner } from "../components/LoadingSpinner";
import { supabase } from "../lib/supabase";

type Status = "loading" | "requiresAuth" | "success" | "error";

export default function InviteAcceptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [appName, setAppName] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Missing invite token.");
      return;
    }

    let cancelled = false;

    async function acceptInvite() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/accept-invite", {
        method: "POST",
        headers,
        body: JSON.stringify({ token }),
      });

      if (cancelled) return;

      const data = await response.json();

      if (data.requiresAuth) {
        setAppName(data.appName || "");
        setStatus("requiresAuth");
        return;
      }

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Failed to accept invite.");
        return;
      }

      setAppName(data.appName || "");
      setStatus("success");
    }

    acceptInvite().catch(() => {
      if (!cancelled) {
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg text-text-main flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-muted">
          <LoadingSpinner />
          Accepting invite...
        </div>
      </div>
    );
  }

  if (status === "requiresAuth") {
    const redirectUrl = `/invite?token=${token}`;
    return (
      <div className="min-h-screen bg-bg text-text-main flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">
            You've been invited to {appName || "a dashboard"}
          </h2>
          <p className="text-sm text-text-muted mb-6">
            Sign in or create an account to accept this invitation.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
              className="h-11 rounded-lg bg-accent text-white text-sm font-medium hover:bg-blue-600 transition-all flex items-center justify-center"
            >
              Sign in
            </Link>
            <Link
              to={`/signup?redirect=${encodeURIComponent(redirectUrl)}`}
              className="h-11 rounded-lg border border-border text-sm font-medium text-text-muted hover:text-text-main transition-colors flex items-center justify-center"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-bg text-text-main flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-emerald-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Invite accepted!</h2>
          <p className="text-sm text-text-muted mb-6">
            You now have access to {appName ? `"${appName}"` : "the shared dashboard"}.
            Notifications will be pushed to your devices.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="h-11 px-6 rounded-lg bg-accent text-white text-sm font-medium hover:bg-blue-600 transition-all cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-bg text-text-main flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-surface border border-red-500/20 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Unable to accept invite</h2>
        <p className="text-sm text-text-muted mb-6">{errorMessage}</p>
        <Link
          to="/dashboard"
          className="inline-flex h-11 px-6 rounded-lg bg-accent text-white text-sm font-medium hover:bg-blue-600 transition-all items-center justify-center"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
