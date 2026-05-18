-- Create portfolio storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload portfolio files
DROP POLICY IF EXISTS "Users can upload portfolio" ON storage.objects;
CREATE POLICY "Users can upload portfolio" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'portfolio'
    AND auth.uid() IS NOT NULL
  );

-- Allow authenticated users to update own portfolio files
DROP POLICY IF EXISTS "Users can update own portfolio" ON storage.objects;
CREATE POLICY "Users can update own portfolio" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'portfolio'
    AND auth.uid() IS NOT NULL
  );

-- Allow public read access to portfolio files
DROP POLICY IF EXISTS "Public can view portfolio" ON storage.objects;
CREATE POLICY "Public can view portfolio" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio');

-- Allow authenticated users to delete own portfolio files
DROP POLICY IF EXISTS "Users can delete own portfolio" ON storage.objects;
CREATE POLICY "Users can delete own portfolio" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'portfolio'
    AND auth.uid() IS NOT NULL
  );
