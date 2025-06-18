-- Create video_processing_jobs table for Vercel queue implementation
CREATE TABLE IF NOT EXISTS video_processing_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES video_uploads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processing_options JSONB DEFAULT '{}',
  ai_analysis_options JSONB DEFAULT '{}',
  video_metadata JSONB DEFAULT '{}',
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Add indexes for performance
CREATE INDEX idx_video_processing_jobs_status ON video_processing_jobs(status);
CREATE INDEX idx_video_processing_jobs_user_id ON video_processing_jobs(user_id);
CREATE INDEX idx_video_processing_jobs_video_id ON video_processing_jobs(video_id);
CREATE INDEX idx_video_processing_jobs_created_at ON video_processing_jobs(created_at);

-- Add RLS policies
ALTER TABLE video_processing_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view own jobs" ON video_processing_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- Only system can insert/update/delete jobs
CREATE POLICY "System can manage jobs" ON video_processing_jobs
  FOR ALL USING (auth.uid() IS NULL);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_processing_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_video_processing_jobs_updated_at
  BEFORE UPDATE ON video_processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_video_processing_jobs_updated_at();