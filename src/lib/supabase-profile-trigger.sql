-- Supabase Profile Auto-creation Trigger
-- このファイルをSupabaseのSQL Editorで実行してください

-- 1. プロファイル自動作成関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 既存のトリガーを削除（存在する場合）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. 新しいトリガーを作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RLSポリシーの設定
ALTER TABLE video_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- 5. video_uploads用のRLSポリシー
CREATE POLICY "Users can view own video uploads" ON video_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video uploads" ON video_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video uploads" ON video_uploads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own video uploads" ON video_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- 6. video_segments用のRLSポリシー
CREATE POLICY "Users can view segments of their videos" ON video_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM video_uploads
      WHERE video_uploads.id = video_segments.video_upload_id
      AND video_uploads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage segments of their videos" ON video_segments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM video_uploads
      WHERE video_uploads.id = video_segments.video_upload_id
      AND video_uploads.user_id = auth.uid()
    )
  );

-- 7. video_projects用のRLSポリシー
CREATE POLICY "Users can view own projects" ON video_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own projects" ON video_projects
  FOR ALL USING (auth.uid() = user_id);

-- 8. user_usage用のRLSポリシー
CREATE POLICY "Users can view own usage" ON user_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON user_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- 9. 既存ユーザーのプロファイル作成（必要な場合）
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT 
  id,
  email,
  created_at,
  now()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 10. Storage バケット作成（Supabase Dashboardで実行）
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('videos', 'videos', false);

-- 11. Storage RLSポリシー（バケット作成後に実行）
-- CREATE POLICY "Users can upload videos" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view own videos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a profile entry for new users';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to create profile on user signup';