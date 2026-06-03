-- Profile banner images: column + storage bucket

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS banner_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

DROP POLICY IF EXISTS "Banner images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own banner" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own banner" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own banner" ON storage.objects;

CREATE POLICY "Banner images are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'banners');

CREATE POLICY "Users can upload own banner"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

CREATE POLICY "Users can update own banner"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

CREATE POLICY "Users can delete own banner"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
