-- Storage Policies for event-photos bucket
-- Run these after creating the bucket in Supabase Dashboard

-- Allow public read access to all files
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-photos');

-- Allow authenticated users to upload files (max 5MB enforced in bucket settings)
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-photos'
    AND (storage.foldername(name))[1] IS NOT NULL
  );

-- Allow event hosts to delete files from their events
CREATE POLICY "Event hosts can delete photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-photos'
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE events.slug = (storage.foldername(name))[1]
      AND events.host_id = auth.uid()
    )
  );
