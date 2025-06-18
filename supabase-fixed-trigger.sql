-- Supabase Profile Auto-creation Trigger (FIXED VERSION)
-- This SQL should be executed in Supabase SQL Editor

-- 1. Create or replace the trigger function for profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (new.id, new.email, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own videos" ON public.video_uploads;
DROP POLICY IF EXISTS "Users can insert own videos" ON public.video_uploads;
DROP POLICY IF EXISTS "Users can update own videos" ON public.video_uploads;
DROP POLICY IF EXISTS "Users can delete own videos" ON public.video_uploads;
DROP POLICY IF EXISTS "Users can view segments of own videos" ON public.video_segments;
DROP POLICY IF EXISTS "Users can manage segments of own videos" ON public.video_segments;

-- 5. Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 6. Create RLS policies for video_uploads
CREATE POLICY "Users can view own videos" ON public.video_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own videos" ON public.video_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos" ON public.video_uploads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos" ON public.video_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Create RLS policies for video_segments (FIXED: using video_upload_id)
CREATE POLICY "Users can view segments of own videos" ON public.video_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.video_uploads
      WHERE video_uploads.id = video_segments.video_upload_id
      AND video_uploads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage segments of own videos" ON public.video_segments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.video_uploads
      WHERE video_uploads.id = video_segments.video_upload_id
      AND video_uploads.user_id = auth.uid()
    )
  );

-- 8. Create RLS policies for video_projects
CREATE POLICY "Users can view own projects" ON public.video_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own projects" ON public.video_projects
  FOR ALL USING (auth.uid() = user_id);

-- 9. Create RLS policies for user_usage
CREATE POLICY "Users can view own usage" ON public.user_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.user_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- 10. Fix foreign key constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.video_uploads TO authenticated;
GRANT ALL ON public.video_segments TO authenticated;
GRANT ALL ON public.video_projects TO authenticated;
GRANT ALL ON public.user_usage TO authenticated;

-- 12. Test trigger functionality (create a sample to verify)
-- This will help verify that the trigger works
DO $$
BEGIN
    RAISE NOTICE 'Profile trigger and RLS policies have been set up successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test user creation to verify profile auto-creation';
    RAISE NOTICE '2. Verify RLS policies are working correctly';
    RAISE NOTICE '3. Check foreign key constraints';
END $$;