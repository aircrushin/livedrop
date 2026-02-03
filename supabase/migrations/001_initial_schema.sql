-- LiveDrop Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  qr_code_url TEXT
);

-- Create photos table
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT true NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_host_id ON public.events(host_id);
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON public.photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON public.photos(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events table
-- Anyone can read events (guests need to find event by slug)
CREATE POLICY "Events are viewable by everyone"
  ON public.events FOR SELECT
  USING (true);

-- Only authenticated users can create events
CREATE POLICY "Authenticated users can create events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

-- Only host can update their events
CREATE POLICY "Hosts can update their own events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- Only host can delete their events
CREATE POLICY "Hosts can delete their own events"
  ON public.events FOR DELETE
  TO authenticated
  USING (auth.uid() = host_id);

-- RLS Policies for photos table
-- Anyone can view visible photos
CREATE POLICY "Visible photos are viewable by everyone"
  ON public.photos FOR SELECT
  USING (is_visible = true);

-- Authenticated users (including anonymous) can upload photos
CREATE POLICY "Authenticated users can upload photos"
  ON public.photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only event hosts can update photos (for moderation)
CREATE POLICY "Event hosts can update photos"
  ON public.photos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = photos.event_id
      AND events.host_id = auth.uid()
    )
  );

-- Only event hosts can delete photos
CREATE POLICY "Event hosts can delete photos"
  ON public.photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = photos.event_id
      AND events.host_id = auth.uid()
    )
  );

-- Enable Realtime for photos table
ALTER PUBLICATION supabase_realtime ADD TABLE public.photos;

-- Storage bucket setup (run separately in Storage settings)
-- Create bucket: event-photos
-- Public bucket: true (for image viewing)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
