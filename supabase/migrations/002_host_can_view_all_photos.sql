-- Allow event hosts to view ALL photos (including hidden ones) for moderation
-- The existing policy only allows viewing visible photos (is_visible = true)
-- This new policy lets hosts see hidden photos in the dashboard

CREATE POLICY "Event hosts can view all photos"
  ON public.photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = photos.event_id
      AND events.host_id = auth.uid()
    )
  );
