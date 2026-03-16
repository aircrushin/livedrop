-- Viewer tracking table for live page view counts

CREATE TABLE IF NOT EXISTS public.event_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'event_viewers_event_id_user_id_key'
      AND conrelid = 'public.event_viewers'::regclass
  ) THEN
    ALTER TABLE public.event_viewers
      ADD CONSTRAINT event_viewers_event_id_user_id_key UNIQUE (event_id, user_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_event_viewers_event_id ON public.event_viewers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_viewers_last_seen_at ON public.event_viewers(last_seen_at);

ALTER TABLE public.event_viewers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_viewers'
      AND policyname = 'Event viewers are viewable by everyone'
  ) THEN
    CREATE POLICY "Event viewers are viewable by everyone"
      ON public.event_viewers
      FOR SELECT
      TO authenticated, anon
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_viewers'
      AND policyname = 'Authenticated users can create their viewer presence'
  ) THEN
    CREATE POLICY "Authenticated users can create their viewer presence"
      ON public.event_viewers
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_viewers'
      AND policyname = 'Authenticated users can update their viewer presence'
  ) THEN
    CREATE POLICY "Authenticated users can update their viewer presence"
      ON public.event_viewers
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'event_viewers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_viewers;
  END IF;
END
$$;
