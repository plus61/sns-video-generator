-- Supabase Profile Auto-creation Trigger
-- This SQL should be executed in Supabase SQL Editor

-- 1. Create profiles table if not exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (new.id, new.email, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 7. Enable RLS on video_uploads table
ALTER TABLE public.video_uploads ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for video_uploads
CREATE POLICY "Users can view own videos" ON public.video_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own videos" ON public.video_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos" ON public.video_uploads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos" ON public.video_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Enable RLS on video_segments table
ALTER TABLE public.video_segments ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for video_segments
CREATE POLICY "Users can view segments of own videos" ON public.video_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.video_uploads
      WHERE video_uploads.id = video_segments.video_id
      AND video_uploads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage segments of own videos" ON public.video_segments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.video_uploads
      WHERE video_uploads.id = video_segments.video_id
      AND video_uploads.user_id = auth.uid()
    )
  );

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.video_uploads TO authenticated;
GRANT ALL ON public.video_segments TO authenticated;