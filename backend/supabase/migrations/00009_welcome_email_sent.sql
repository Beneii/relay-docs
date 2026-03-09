-- Relay: Add welcome_email_sent flag to profiles
-- Prevents duplicate welcome emails on repeated API calls.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN NOT NULL DEFAULT false;
