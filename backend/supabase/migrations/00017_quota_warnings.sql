-- Migration: Quota warning tracking columns on profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quota_warning_80_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS quota_warning_100_sent_at timestamptz;
