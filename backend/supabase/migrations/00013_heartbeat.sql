ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS heartbeat_interval_minutes integer CHECK (heartbeat_interval_minutes IS NULL OR heartbeat_interval_minutes > 0),
  ADD COLUMN IF NOT EXISTS heartbeat_last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS heartbeat_alerted_at timestamptz;
