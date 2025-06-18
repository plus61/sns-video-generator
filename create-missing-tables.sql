-- Create missing tables: video_segments and user_usage
-- Execute in Supabase SQL Editor

-- 1. Create video_segments table
CREATE TABLE IF NOT EXISTS video_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_upload_id UUID NOT NULL REFERENCES video_uploads(id) ON DELETE CASCADE,
    start_time INTEGER NOT NULL, -- in seconds
    end_time INTEGER NOT NULL, -- in seconds
    title TEXT,
    description TEXT,
    content_type TEXT, -- 'education', 'entertainment', 'trivia', etc.
    engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 10),
    transcript_segment TEXT,
    visual_cues JSONB,
    audio_features JSONB,
    export_url TEXT,
    platform_optimizations JSONB, -- TikTok, Instagram, etc. specific data
    status TEXT DEFAULT 'extracted' CHECK (status IN ('extracted', 'edited', 'exported', 'published')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user_usage table
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    videos_generated INTEGER DEFAULT 0,
    last_generation_at TIMESTAMP WITH TIME ZONE,
    monthly_limit INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_video_segments_video_upload_id ON video_segments(video_upload_id);
CREATE INDEX IF NOT EXISTS idx_video_segments_engagement_score ON video_segments(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_video_segments_content_type ON video_segments(content_type);

-- 4. Create triggers for updated_at
CREATE TRIGGER update_video_segments_updated_at BEFORE UPDATE ON video_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_usage_updated_at BEFORE UPDATE ON user_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE public.video_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for video_segments
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

-- 7. Create RLS policies for user_usage
CREATE POLICY "Users can view own usage" ON public.user_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.user_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- 8. Grant permissions
GRANT ALL ON public.video_segments TO authenticated;
GRANT ALL ON public.user_usage TO authenticated;

-- 9. Verification message
DO $$
BEGIN
    RAISE NOTICE 'Missing tables created successfully!';
    RAISE NOTICE 'Tables: video_segments, user_usage';
    RAISE NOTICE 'RLS policies applied';
    RAISE NOTICE 'Ready for Phase 1 completion!';
END $$;