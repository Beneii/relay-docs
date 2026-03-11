-- Harden shared app access and expose a safe shared-app projection.

DROP POLICY IF EXISTS "Members can read shared apps" ON public.apps;

CREATE OR REPLACE FUNCTION public.list_accessible_apps()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  url TEXT,
  icon TEXT,
  accent_color TEXT,
  notifications_enabled BOOLEAN,
  webhook_token TEXT,
  heartbeat_interval_minutes INTEGER,
  heartbeat_last_seen_at TIMESTAMPTZ,
  heartbeat_alerted_at TIMESTAMPTZ,
  custom_icon_url TEXT,
  custom_app_name TEXT,
  background_color TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  is_owner BOOLEAN,
  member_role TEXT,
  can_send_notifications BOOLEAN,
  owner_email TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.user_id,
    a.name,
    a.url,
    a.icon,
    a.accent_color,
    a.notifications_enabled,
    a.webhook_token,
    a.heartbeat_interval_minutes,
    a.heartbeat_last_seen_at,
    a.heartbeat_alerted_at,
    a.custom_icon_url,
    a.custom_app_name,
    a.background_color,
    a.created_at,
    a.updated_at,
    a.last_opened_at,
    true AS is_owner,
    NULL::TEXT AS member_role,
    true AS can_send_notifications,
    NULL::TEXT AS owner_email
  FROM public.apps a
  WHERE a.user_id = auth.uid()

  UNION ALL

  SELECT
    a.id,
    a.user_id,
    a.name,
    a.url,
    a.icon,
    a.accent_color,
    a.notifications_enabled,
    NULL::TEXT AS webhook_token,
    a.heartbeat_interval_minutes,
    a.heartbeat_last_seen_at,
    a.heartbeat_alerted_at,
    a.custom_icon_url,
    a.custom_app_name,
    a.background_color,
    a.created_at,
    a.updated_at,
    a.last_opened_at,
    false AS is_owner,
    dm.role AS member_role,
    (dm.role = 'editor') AS can_send_notifications,
    owner_profile.email AS owner_email
  FROM public.dashboard_members dm
  JOIN public.apps a
    ON a.id = dm.app_id
  JOIN public.profiles owner_profile
    ON owner_profile.id = a.user_id
  WHERE dm.user_id = auth.uid()
    AND dm.status = 'accepted';
$$;

CREATE OR REPLACE FUNCTION public.get_accessible_app(p_app_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  url TEXT,
  icon TEXT,
  accent_color TEXT,
  notifications_enabled BOOLEAN,
  webhook_token TEXT,
  heartbeat_interval_minutes INTEGER,
  heartbeat_last_seen_at TIMESTAMPTZ,
  heartbeat_alerted_at TIMESTAMPTZ,
  custom_icon_url TEXT,
  custom_app_name TEXT,
  background_color TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  is_owner BOOLEAN,
  member_role TEXT,
  can_send_notifications BOOLEAN,
  owner_email TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.list_accessible_apps()
  WHERE id = p_app_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.list_accessible_apps() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_accessible_app(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.list_accessible_apps() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_accessible_app(UUID) TO authenticated;
