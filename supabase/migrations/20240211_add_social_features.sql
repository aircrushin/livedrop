-- SQL Migration for Social Features (FR-3.1)
-- Run this in your Supabase SQL Editor

-- Enable RLS (Row Level Security) if not already enabled
alter table photos enable row level security;

-- Create photo_likes table
CREATE TABLE IF NOT EXISTS photo_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, user_id)
);

-- Create photo_comments table
CREATE TABLE IF NOT EXISTS photo_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
alter table photo_likes enable row level security;
alter table photo_comments enable row level security;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photo_likes_photo_id ON photo_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_likes_user_id ON photo_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_comments_photo_id ON photo_comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_comments_user_id ON photo_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_comments_created_at ON photo_comments(created_at);

-- RLS Policies for photo_likes
CREATE POLICY "Allow authenticated users to view likes"
  ON photo_likes
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow authenticated users to like photos"
  ON photo_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to unlike their own likes"
  ON photo_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for photo_comments
CREATE POLICY "Allow authenticated users to view comments"
  ON photo_comments
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow authenticated users to add comments"
  ON photo_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own comments"
  ON photo_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable Realtime for the new tables
-- Note: Run this in your Supabase dashboard under Database > Realtime
-- Or use the following if you have the necessary permissions:

-- Uncomment the following if you have realtime admin access:
-- BEGIN;
--   -- Add tables to the publication
--   ALTER PUBLICATION supabase_realtime ADD TABLE photo_likes;
--   ALTER PUBLICATION supabase_realtime ADD TABLE photo_comments;
-- COMMIT;

-- Alternative: Use the Supabase Dashboard
-- 1. Go to Database > Realtime in your Supabase dashboard
-- 2. Toggle ON the following tables:
--    - photo_likes
--    - photo_comments

-- Test queries to verify setup:
-- SELECT * FROM photo_likes LIMIT 1;
-- SELECT * FROM photo_comments LIMIT 1;
