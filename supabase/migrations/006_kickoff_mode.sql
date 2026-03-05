-- Kickoff mode and collaborative permissions (Host Kickoff Mode PRD v1.0)

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS display_mode TEXT NOT NULL DEFAULT 'live';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_display_mode_check'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_display_mode_check
      CHECK (display_mode IN ('kickoff', 'live'));
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
      AND tablename = 'events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;
END
$$;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS kickoff_config JSONB NOT NULL DEFAULT jsonb_build_object(
    'enabled', false,
    'title', '',
    'subtitle', '',
    'countdown_end_at', null,
    'auto_switch', false
  );

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS display_mode_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.event_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('manager', 'moderator', 'viewer')),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_members_event_id ON public.event_members(event_id);
CREATE INDEX IF NOT EXISTS idx_event_members_user_id ON public.event_members(user_id);

ALTER TABLE public.event_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_members'
      AND policyname = 'Event members can view their own memberships'
  ) THEN
    CREATE POLICY "Event members can view their own memberships"
      ON public.event_members
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_members'
      AND policyname = 'Event hosts can manage memberships'
  ) THEN
    CREATE POLICY "Event hosts can manage memberships"
      ON public.event_members
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.events
          WHERE events.id = event_members.event_id
            AND events.host_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.events
          WHERE events.id = event_members.event_id
            AND events.host_id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'events'
      AND policyname = 'Managers can update assigned events'
  ) THEN
    CREATE POLICY "Managers can update assigned events"
      ON public.events
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.event_members
          WHERE event_members.event_id = events.id
            AND event_members.user_id = auth.uid()
            AND event_members.role = 'manager'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.event_members
          WHERE event_members.event_id = events.id
            AND event_members.user_id = auth.uid()
            AND event_members.role = 'manager'
        )
      );
  END IF;
END
$$;
