-- Migration: Custom branding fields for apps (Pro feature)
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS custom_icon_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_app_name TEXT,
  ADD COLUMN IF NOT EXISTS background_color TEXT;
