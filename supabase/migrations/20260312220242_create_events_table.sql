-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  date TIMESTAMPTZ,
  location TEXT,
  description TEXT,
  cover_photo TEXT,
  checkout_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Allow everyone to read available events
CREATE POLICY "Public read access for available events" ON public.events
  FOR SELECT USING (is_available = true);

-- 2. Allow authenticated users (admin) to perform all actions
CREATE POLICY "Admin full access for events" ON public.events
  FOR ALL TO authenticated USING (true);
