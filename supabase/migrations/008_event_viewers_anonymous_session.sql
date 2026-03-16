-- Scheme B: anonymous viewer tracking with nullable user_id + session_id dedupe

CREATE TABLE IF NOT EXISTS public.event_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.event_viewers
  ADD COLUMN IF NOT EXISTS session_id TEXT;

UPDATE public.event_viewers
SET session_id = COALESCE(
  session_id,
  md5(event_id::text || ':' || COALESCE(user_id::text, id::text))
)
WHERE session_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'event_viewers'
      AND column_name = 'session_id'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.event_viewers
      ALTER COLUMN session_id SET NOT NULL;
  END IF;
END
$$;

ALTER TABLE public.event_viewers
  ALTER COLUMN user_id DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'event_viewers_event_id_user_id_key'
      AND conrelid = 'public.event_viewers'::regclass
  ) THEN
    ALTER TABLE public.event_viewers
      DROP CONSTRAINT event_viewers_event_id_user_id_key;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'event_viewers_event_id_session_id_key'
      AND conrelid = 'public.event_viewers'::regclass
  ) THEN
    ALTER TABLE public.event_viewers
      ADD CONSTRAINT event_viewers_event_id_session_id_key UNIQUE (event_id, session_id);
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

CREATE INDEX IF NOT EXISTS idx_event_viewers_session_id ON public.event_viewers(session_id);

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
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_viewers'
      AND policyname = 'Authenticated users can create their viewer presence'
  ) THEN
    DROP POLICY "Authenticated users can create their viewer presence" ON public.event_viewers;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_viewers'
      AND policyname = 'Authenticated users can update their viewer presence'
  ) THEN
    DROP POLICY "Authenticated users can update their viewer presence" ON public.event_viewers;
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
      AND policyname = 'Authenticated users can create viewer presence by session'
  ) THEN
    CREATE POLICY "Authenticated users can create viewer presence by session"
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
      AND policyname = 'Authenticated users can update viewer presence by session'
  ) THEN
    CREATE POLICY "Authenticated users can update viewer presence by session"
      ON public.event_viewers
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id OR user_id IS NULL)
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
      AND policyname = 'Anonymous users can create anonymous viewer presence'
  ) THEN
    CREATE POLICY "Anonymous users can create anonymous viewer presence"
      ON public.event_viewers
      FOR INSERT
      TO anon
      WITH CHECK (user_id IS NULL);
  END IF;
END
$$;
