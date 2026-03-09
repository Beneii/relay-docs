-- Relay: Device Constraints
-- Adds token format check and max devices limit.

-- Add token format check (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'devices_expo_push_token_check'
      AND conrelid = 'public.devices'::regclass
  ) THEN
    ALTER TABLE public.devices
      ADD CONSTRAINT devices_expo_push_token_check
      CHECK (expo_push_token LIKE 'ExponentPushToken[%]');
  END IF;
END $$;

-- Trigger function to limit max devices per user
CREATE OR REPLACE FUNCTION public.check_max_devices()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  device_count INTEGER;
BEGIN
  SELECT count(*) INTO device_count
  FROM public.devices
  WHERE user_id = NEW.user_id;

  IF device_count >= 10 THEN
    RAISE EXCEPTION 'Max devices limit (10) reached for this user';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger (idempotent)
DROP TRIGGER IF EXISTS on_device_insert ON public.devices;

CREATE TRIGGER on_device_insert
  BEFORE INSERT ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_devices();
