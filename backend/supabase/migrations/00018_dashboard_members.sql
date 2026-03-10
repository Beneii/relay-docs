-- Migration: Dashboard members for team sharing

CREATE TABLE public.dashboard_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invite_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(app_id, email)
);

CREATE INDEX idx_dashboard_members_app_id ON public.dashboard_members(app_id);
CREATE INDEX idx_dashboard_members_email ON public.dashboard_members(email);
CREATE INDEX idx_dashboard_members_invite_token ON public.dashboard_members(invite_token);

ALTER TABLE public.dashboard_members ENABLE ROW LEVEL SECURITY;

-- App owners can manage all members of their apps
CREATE POLICY "Owners can manage dashboard members"
  ON public.dashboard_members FOR ALL
  USING (app_id IN (SELECT id FROM public.apps WHERE user_id = auth.uid()))
  WITH CHECK (app_id IN (SELECT id FROM public.apps WHERE user_id = auth.uid()));

-- Invited users can read their own invites
CREATE POLICY "Users can read own invites"
  ON public.dashboard_members FOR SELECT
  USING (user_id = auth.uid());

-- Invited users can accept/decline their own invites
CREATE POLICY "Users can accept/decline own invites"
  ON public.dashboard_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Members can read apps they're accepted into
CREATE POLICY "Members can read shared apps"
  ON public.apps FOR SELECT
  USING (
    user_id = auth.uid() OR
    id IN (
      SELECT app_id FROM public.dashboard_members
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

-- Members can read shared notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own or shared notifications"
  ON public.notifications FOR SELECT
  USING (
    user_id = auth.uid() OR
    app_id IN (
      SELECT app_id FROM public.dashboard_members
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

-- Service role can manage dashboard members (for invite/accept API endpoints)
CREATE POLICY "Service can manage dashboard members"
  ON public.dashboard_members FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
