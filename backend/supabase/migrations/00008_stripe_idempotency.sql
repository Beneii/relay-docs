-- Relay: Stripe Webhook Idempotency
-- Tracks processed Stripe event IDs to prevent duplicate processing.

CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  id TEXT PRIMARY KEY, -- Stripe event.id
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for cleanup (e.g., if we want to delete events older than 30 days)
CREATE INDEX idx_processed_stripe_events_created_at ON public.processed_stripe_events(created_at);

-- RLS: Only the service role (Edge Functions/Backend) should manage this table
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage stripe events"
  ON public.processed_stripe_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Cleanup: delete processed events older than 30 days (runs daily at 3 AM UTC)
SELECT cron.schedule(
  'cleanup-processed-stripe-events',
  '0 3 * * *',
  $$DELETE FROM public.processed_stripe_events WHERE created_at < now() - INTERVAL '30 days'$$
);
