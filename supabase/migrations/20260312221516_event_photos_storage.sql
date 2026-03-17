-- Create event_photos table
CREATE TABLE IF NOT EXISTS public.event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Remove cover_photo from events table
ALTER TABLE public.events DROP COLUMN IF EXISTS cover_photo;

-- Create Storage Bucket for event covers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-covers', 'event-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on event_photos
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

-- Policies for event_photos
CREATE POLICY "Public read access for event photos" ON public.event_photos
  FOR SELECT USING (true);

CREATE POLICY "Admin full access for event photos" ON public.event_photos
  FOR ALL TO authenticated USING (true);

-- Storage Policies for 'event-covers' bucket
-- 1. Allow public to read files
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-covers');

-- 2. Allow authenticated users to upload/manage files
CREATE POLICY "Admin Manage Files" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'event-covers');
