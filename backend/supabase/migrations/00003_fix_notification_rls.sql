-- Relay: Scope notification inserts to service_role only

DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;

CREATE POLICY "Service can insert notifications"
  ON public.notifications FOR INSERT
  TO service_role
  WITH CHECK (true);
