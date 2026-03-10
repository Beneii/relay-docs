-- Migration: Quiet hours per device + channel notification preferences

-- Quiet hours columns on devices
ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS quiet_start time,  -- e.g. '23:00'
  ADD COLUMN IF NOT EXISTS quiet_end time;    -- e.g. '07:00'

-- Channel preferences table
CREATE TABLE IF NOT EXISTS public.channel_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  muted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_channel_preferences_user_id ON public.channel_preferences(user_id);

ALTER TABLE public.channel_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own channel preferences"
  ON public.channel_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read channel preferences (for edge function filtering)
CREATE POLICY "Service can read channel preferences"
  ON public.channel_preferences FOR SELECT
  TO service_role
  USING (true);
