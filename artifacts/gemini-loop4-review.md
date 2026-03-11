# Review: Loop 4 Implementation — Gemini Council

- **RESULT:** needs-fixes
- **BUGS & CORRECTNESS:**
    - **Timezone Desync (CRITICAL):** The `isInQuietHours` check in the `notify` edge function compares the current UTC time (`now.getUTCHours()`) against the time strings saved by the mobile app (e.g., "23:00"). However, the mobile app saves the user's **local** wall-clock time without converting to UTC. This means quiet hours will be offset by the user's timezone (e.g., for a user in EST/UTC-5, "23:00" local time will be treated as 18:00 UTC, causing notifications to be silenced in the afternoon).
    - **Overnight Wrap:** The range check logic `nowMins >= startMins || nowMins < endMins` correctly handles overnight windows (e.g., 23:00 to 07:00).
    - **Critical Bypass:** Verified that `severity === "critical"` correctly bypasses both quiet hours and channel muting.
- **SECURITY:**
    - **Hardened Callbacks:** The introduction of `callbackToken` (an HMAC of the notification ID) and mobile-side signing of action button POST requests is a significant security improvement. It prevents simple spoofing of action callbacks.
    - **RLS:** `channel_preferences` has proper RLS policies for both users and the service role.
- **UX:**
    - **Misleading Status:** In `RecentNotificationsPanel.tsx`, a notification with `pushed_count: 0` defaults to displaying "No devices registered." This is misleading if the push was actually skipped due to **Quiet Hours** or **Channel Muting**. The UI should distinguish between "No devices" and "Push skipped by preferences."
    - **Mobile Time Selection:** The "cycle hour" UI in `settings.tsx` is pragmatic for a MVP but limits users to top-of-the-hour increments (e.g., cannot set 23:30).
- **VERDICT:**
    - **Fix Timezone Handling.** The mobile app should either save quiet hours in UTC or include the device's timezone offset in the `devices` table so the edge function can perform a local-time comparison.
- **CONFIDENCE:** 0.95
