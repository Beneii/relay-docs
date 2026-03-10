import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

import { supabase } from "../../lib/supabase";

interface ChannelPreference {
  channel: string;
  muted: boolean;
}

interface ChannelPreferencesSectionProps {
  userId: string;
}

export function ChannelPreferencesSection({ userId }: ChannelPreferencesSectionProps) {
  const [channels, setChannels] = useState<ChannelPreference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchChannels() {
      // Get distinct channels from notifications
      const { data: notifChannels } = await supabase
        .from("notifications")
        .select("channel")
        .eq("user_id", userId)
        .not("channel", "is", null);

      if (cancelled) return;

      const uniqueChannels = [
        ...new Set(
          (notifChannels || [])
            .map((n: { channel: string | null }) => n.channel)
            .filter((c): c is string => c !== null)
        ),
      ].sort();

      if (uniqueChannels.length === 0) {
        setChannels([]);
        setLoading(false);
        return;
      }

      // Get existing preferences
      const { data: prefs } = await supabase
        .from("channel_preferences")
        .select("channel, muted")
        .eq("user_id", userId);

      if (cancelled) return;

      const prefMap = new Map(
        (prefs || []).map((p: { channel: string; muted: boolean }) => [p.channel, p.muted])
      );

      setChannels(
        uniqueChannels.map((channel) => ({
          channel,
          muted: prefMap.get(channel) ?? false,
        }))
      );
      setLoading(false);
    }

    fetchChannels();
    return () => { cancelled = true; };
  }, [userId]);

  const handleToggle = async (channel: string, currentMuted: boolean) => {
    const newMuted = !currentMuted;

    // Optimistic update
    setChannels((prev) =>
      prev.map((c) => (c.channel === channel ? { ...c, muted: newMuted } : c))
    );

    const { error } = await supabase
      .from("channel_preferences")
      .upsert(
        { user_id: userId, channel, muted: newMuted },
        { onConflict: "user_id,channel" }
      );

    if (error) {
      // Revert on error
      setChannels((prev) =>
        prev.map((c) => (c.channel === channel ? { ...c, muted: currentMuted } : c))
      );
      console.error("Failed to update channel preference:", error);
    }
  };

  if (loading || channels.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        Notification Channels
      </h3>
      <div className="space-y-2">
        {channels.map(({ channel, muted }) => (
          <div
            key={channel}
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-2">
              {muted ? (
                <BellOff className="w-4 h-4 text-text-muted" />
              ) : (
                <Bell className="w-4 h-4 text-accent" />
              )}
              <span className="text-sm font-mono text-text-main">{channel}</span>
            </div>
            <button
              onClick={() => handleToggle(channel, muted)}
              className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
                muted ? "bg-border" : "bg-accent"
              }`}
              aria-label={`${muted ? "Unmute" : "Mute"} ${channel} channel`}
              aria-pressed={!muted}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  muted ? "left-0.5" : "left-[18px]"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted mt-3">
        Muted channels still store notifications but won't send push alerts.
      </p>
    </div>
  );
}
