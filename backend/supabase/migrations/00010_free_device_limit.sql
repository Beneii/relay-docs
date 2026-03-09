-- Relay: Free Device Limit
-- Updates the check_max_devices trigger to enforce plan-based device limits:
--   free users: max 1 device
--   pro users:  max 10 devices

CREATE OR REPLACE FUNCTION public.check_max_devices()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  device_count INTEGER;
  user_plan    TEXT;
  max_devices  INTEGER;
BEGIN
  SELECT plan INTO user_plan
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF user_plan = 'pro' THEN
    max_devices := 10;
  ELSE
    max_devices := 1;
  END IF;

  SELECT count(*) INTO device_count
  FROM public.devices
  WHERE user_id = NEW.user_id;

  IF device_count >= max_devices THEN
    IF user_plan = 'pro' THEN
      RAISE EXCEPTION 'Max devices limit (10) reached for this user';
    ELSE
      RAISE EXCEPTION 'Free plan is limited to 1 device. Upgrade to Pro for up to 10 devices.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
