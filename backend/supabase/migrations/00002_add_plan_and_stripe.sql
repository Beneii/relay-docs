-- Relay: Add plan and Stripe customer fields to profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

UPDATE public.profiles
SET plan = 'free'
WHERE plan IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN plan SET DEFAULT 'free';

ALTER TABLE public.profiles
  ALTER COLUMN plan SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_plan_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_plan_check
      CHECK (plan IN ('free', 'pro'));
  END IF;
END $$;
