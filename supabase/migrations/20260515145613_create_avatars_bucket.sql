-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload avatars
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
  );

-- Allow authenticated users to update their own avatars
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
  );

-- Allow public read access to avatars
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to delete their own avatars
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
  );

-- Create curriculums storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('curriculums', 'curriculums', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload curriculums
DROP POLICY IF EXISTS "Users can upload curriculums" ON storage.objects;
CREATE POLICY "Users can upload curriculums" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'curriculums'
    AND auth.uid() IS NOT NULL
  );

-- Allow authenticated users to update their own curriculums
DROP POLICY IF EXISTS "Users can update own curriculums" ON storage.objects;
CREATE POLICY "Users can update own curriculums" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'curriculums'
    AND auth.uid() IS NOT NULL
  );

-- Allow authenticated users to view curriculums
DROP POLICY IF EXISTS "Users can view curriculums" ON storage.objects;
CREATE POLICY "Users can view curriculums" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'curriculums'
    AND auth.uid() IS NOT NULL
  );
