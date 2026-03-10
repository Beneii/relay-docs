ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS request_signature text;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS pushed_count integer NOT NULL DEFAULT 0;
