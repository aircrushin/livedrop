-- Add theme configuration to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{}';
-- Add cover_image and banner_image columns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_image TEXT;
