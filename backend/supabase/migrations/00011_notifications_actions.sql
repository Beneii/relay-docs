-- Add interactive notification fields to notifications table
ALTER TABLE public.notifications
  ADD COLUMN severity text NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'critical')),
  ADD COLUMN channel text,
  ADD COLUMN actions_json jsonb,
  ADD COLUMN deep_link_url text
    CHECK (deep_link_url IS NULL OR char_length(deep_link_url) <= 2048);

CREATE INDEX IF NOT EXISTS notifications_channel_idx
  ON public.notifications (user_id, channel)
  WHERE channel IS NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_severity_idx
  ON public.notifications (user_id, severity, created_at DESC)
  WHERE severity != 'info';
