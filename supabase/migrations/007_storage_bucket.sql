-- Create storage bucket for KOL profile images
-- Run this in Supabase SQL Editor

-- Insert the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kol-images',
  'kol-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Policy to allow public read access
CREATE POLICY "Public can view kol images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'kol-images');

-- Policy to allow authenticated uploads (service role)
CREATE POLICY "Service role can upload kol images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'kol-images');

-- Policy to allow authenticated updates
CREATE POLICY "Service role can update kol images"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'kol-images');

-- Policy to allow authenticated deletes
CREATE POLICY "Service role can delete kol images"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'kol-images');
