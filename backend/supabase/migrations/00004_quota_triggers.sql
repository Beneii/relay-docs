-- Relay: Enforce plan quotas with BEFORE INSERT triggers

CREATE OR REPLACE FUNCTION public.enforce_app_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan TEXT;
  current_app_count INTEGER;
BEGIN
  SELECT COALESCE(plan, 'free')
  INTO user_plan
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF user_plan = 'free' THEN
    SELECT COUNT(*)
    INTO current_app_count
    FROM public.apps
    WHERE user_id = NEW.user_id;

    IF current_app_count >= 3 THEN
      RAISE EXCEPTION 'Free plan is limited to 3 apps'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_app_limit ON public.apps;

CREATE TRIGGER enforce_app_limit
  BEFORE INSERT ON public.apps
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_app_limit();


CREATE OR REPLACE FUNCTION public.enforce_notification_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan TEXT;
  monthly_limit INTEGER;
  month_start TIMESTAMPTZ;
  next_month_start TIMESTAMPTZ;
  monthly_notification_count INTEGER;
BEGIN
  SELECT COALESCE(plan, 'free')
  INTO user_plan
  FROM public.profiles
  WHERE id = NEW.user_id;

  monthly_limit := CASE
    WHEN user_plan = 'pro' THEN 10000
    ELSE 100
  END;

  month_start := date_trunc('month', now());
  next_month_start := month_start + INTERVAL '1 month';

  SELECT COUNT(*)
  INTO monthly_notification_count
  FROM public.notifications
  WHERE user_id = NEW.user_id
    AND created_at >= month_start
    AND created_at < next_month_start;

  IF monthly_notification_count >= monthly_limit THEN
    RAISE EXCEPTION 'Monthly notification quota exceeded for plan %', user_plan
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_notification_quota ON public.notifications;

CREATE TRIGGER enforce_notification_quota
  BEFORE INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_notification_quota();
