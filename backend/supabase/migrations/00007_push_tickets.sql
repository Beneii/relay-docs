-- Relay: Add push_tickets table for Expo receipt tracking

CREATE TABLE public.push_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  ticket_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ok', 'error')),
  error_type TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_push_tickets_pending
  ON public.push_tickets(created_at)
  WHERE status = 'pending';

CREATE INDEX idx_push_tickets_notification_id
  ON public.push_tickets(notification_id);

-- RLS: only service role needs access
ALTER TABLE public.push_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage push tickets"
  ON public.push_tickets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- pg_cron: process receipts every 30 minutes
-- Requires pg_cron and pg_net extensions (standard on Supabase Pro+)

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule: invoke the process-receipts edge function every 30 minutes
-- The edge function URL uses the project's Supabase URL; pg_net.http_post
-- sends an internal request with the service_role key for auth.
SELECT cron.schedule(
  'process-expo-receipts',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/process-receipts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
