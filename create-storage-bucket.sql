-- Supabase Storage: videos バケット作成とRLS設定
-- Execute in Supabase SQL Editor

-- 1. Create videos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create RLS policies for videos bucket
-- Policy 1: Users can upload to their own folder
CREATE POLICY "Users can upload videos to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 2: Users can view their own videos
CREATE POLICY "Users can view own videos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 3: Users can update their own videos
CREATE POLICY "Users can update own videos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 4: Users can delete their own videos
CREATE POLICY "Users can delete own videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. Grant storage permissions to authenticated users
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- 4. Verification message
DO $$
BEGIN
    RAISE NOTICE 'Videos storage bucket created successfully!';
    RAISE NOTICE 'RLS policies applied for user-specific folder access';
    RAISE NOTICE 'Ready for video upload implementation!';
END $$;