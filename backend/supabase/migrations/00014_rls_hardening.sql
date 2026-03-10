-- Relay: RLS hardening pass

-- Allow users to delete their own notifications (clear history)
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Allow users to read their own push_tickets via notification join
-- (currently push_tickets is service_role only — add read access so
--  delivery status can be surfaced in the dashboard)
CREATE POLICY "Users can read own push tickets"
  ON public.push_tickets FOR SELECT
  USING (
    notification_id IN (
      SELECT id FROM public.notifications WHERE user_id = auth.uid()
    )
  );
