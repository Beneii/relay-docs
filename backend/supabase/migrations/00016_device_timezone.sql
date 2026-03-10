-- Store device UTC offset so quiet hours can be compared in local time
ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS utc_offset_minutes integer NOT NULL DEFAULT 0;
