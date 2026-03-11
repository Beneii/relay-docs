-- Migration: Fix outbound webhooks constraints
-- Removes UNIQUE(app_id, provider) which incorrectly limits each app to one
-- webhook per provider, conflicting with PRO_LIMITS.outboundWebhooks = 5.
-- Adds service_role UPDATE policy required by the notify edge function.

ALTER TABLE public.outbound_webhooks DROP CONSTRAINT IF EXISTS outbound_webhooks_app_id_provider_key;

CREATE POLICY "Service can update outbound webhooks"
  ON public.outbound_webhooks FOR UPDATE
  TO service_role
  USING (true);
