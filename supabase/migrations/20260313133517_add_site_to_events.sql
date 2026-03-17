-- Add site column up to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS site TEXT;
