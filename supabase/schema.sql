-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  usage_count INTEGER DEFAULT 0,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video projects table
CREATE TABLE IF NOT EXISTS video_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    prompt TEXT NOT NULL,
    script TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
    video_url TEXT,
    thumbnail_url TEXT,
    duration INTEGER, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video templates table
CREATE TABLE IF NOT EXISTS video_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    thumbnail_url TEXT,
    config JSONB NOT NULL, -- Store template configuration as JSON
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User video usage tracking
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_projects_user_id ON video_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_video_projects_status ON video_projects(status);
CREATE INDEX IF NOT EXISTS idx_video_projects_created_at ON video_projects(created_at);
CREATE INDEX IF NOT EXISTS idx_video_templates_category ON video_templates(category);
CREATE INDEX IF NOT EXISTS idx_video_templates_active ON video_templates(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create video_uploads table for long-form video analysis
CREATE TABLE IF NOT EXISTS video_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_filename TEXT,
    file_size BIGINT,
    file_type TEXT,
    duration INTEGER, -- in seconds
    storage_path TEXT,
    public_url TEXT,
    youtube_url TEXT,
    youtube_video_id TEXT,
    upload_source TEXT NOT NULL CHECK (upload_source IN ('file', 'youtube')),
    status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'pending_download', 'processing', 'ready_for_analysis', 'analyzing', 'completed', 'error')),
    error_message TEXT,
    transcript TEXT,
    analysis_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video_segments table for extracted short clips
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

-- Additional indexes for new tables
CREATE INDEX IF NOT EXISTS idx_video_uploads_user_id ON video_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_video_uploads_status ON video_uploads(status);
CREATE INDEX IF NOT EXISTS idx_video_uploads_created_at ON video_uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_video_segments_video_upload_id ON video_segments(video_upload_id);
CREATE INDEX IF NOT EXISTS idx_video_segments_engagement_score ON video_segments(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_video_segments_content_type ON video_segments(content_type);

-- Create triggers for updated_at
-- CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); -- Disabled as auth.users is managed by Supabase
CREATE TRIGGER update_video_projects_updated_at BEFORE UPDATE ON video_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_templates_updated_at BEFORE UPDATE ON video_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_usage_updated_at BEFORE UPDATE ON user_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_uploads_updated_at BEFORE UPDATE ON video_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_segments_updated_at BEFORE UPDATE ON video_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default video templates
INSERT INTO video_templates (name, description, category, config) VALUES
('Social Media Short', 'Perfect for Instagram Reels and TikTok', 'social', '{
    "duration": 15,
    "dimensions": {"width": 1080, "height": 1920},
    "background": {"type": "gradient", "value": "linear-gradient(45deg, #667eea 0%, #764ba2 100%)"},
    "text_styles": [
        {
            "id": "title",
            "name": "Title",
            "font_family": "Arial Black",
            "font_size": 48,
            "font_weight": 800,
            "color": "#ffffff",
            "background_color": "rgba(0,0,0,0.5)",
            "padding": 16,
            "border_radius": 8
        }
    ],
    "animation_presets": [
        {
            "id": "fade_in",
            "name": "Fade In",
            "type": "fade",
            "duration": 1000,
            "easing": "ease-in-out"
        }
    ]
}'),
('YouTube Short', 'Optimized for YouTube Shorts', 'youtube', '{
    "duration": 30,
    "dimensions": {"width": 1080, "height": 1920},
    "background": {"type": "color", "value": "#000000"},
    "text_styles": [
        {
            "id": "main_title",
            "name": "Main Title",
            "font_family": "Arial",
            "font_size": 52,
            "font_weight": 700,
            "color": "#ff0000"
        }
    ],
    "animation_presets": [
        {
            "id": "slide_up",
            "name": "Slide Up",
            "type": "slide",
            "duration": 800,
            "easing": "ease-out"
        }
    ]
}'),
('Square Post', 'Perfect for Instagram and Facebook posts', 'social', '{
    "duration": 10,
    "dimensions": {"width": 1080, "height": 1080},
    "background": {"type": "gradient", "value": "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)"},
    "text_styles": [
        {
            "id": "center_text",
            "name": "Center Text",
            "font_family": "Arial",
            "font_size": 42,
            "font_weight": 600,
            "color": "#ffffff"
        }
    ],
    "animation_presets": [
        {
            "id": "zoom_in",
            "name": "Zoom In",
            "type": "zoom",
            "duration": 1200,
            "easing": "ease-in-out"
        }
    ]
}')
ON CONFLICT DO NOTHING;