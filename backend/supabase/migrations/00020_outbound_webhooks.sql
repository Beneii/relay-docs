-- Migration: Outbound webhooks for automation connectors (Zapier, n8n, Make.com)
CREATE TABLE public.outbound_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT,
  provider TEXT NOT NULL DEFAULT 'custom' CHECK (provider IN ('custom', 'zapier')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(app_id, provider)
);

CREATE INDEX idx_outbound_webhooks_app_id ON public.outbound_webhooks(app_id);
CREATE INDEX idx_outbound_webhooks_user_id ON public.outbound_webhooks(user_id);

ALTER TABLE public.outbound_webhooks ENABLE ROW LEVEL SECURITY;

-- App owners can manage their outbound webhooks
CREATE POLICY "Owners can manage outbound webhooks"
  ON public.outbound_webhooks FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role full access (for edge function to read webhook URLs)
CREATE POLICY "Service can read outbound webhooks"
  ON public.outbound_webhooks FOR SELECT
  TO service_role
  USING (true);
