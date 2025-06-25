-- Create upload_progress table for tracking video upload/processing progress
CREATE TABLE IF NOT EXISTS upload_progress (
  video_id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('upload', 'processing', 'complete', 'error')),
  progress INTEGER NOT NULL CHECK (progress >= 0 AND progress <= 100),
  message TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_upload_progress_updated_at ON upload_progress(updated_at DESC);

-- Enable RLS
ALTER TABLE upload_progress ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read their own progress
CREATE POLICY "Users can read their own upload progress" ON upload_progress
  FOR SELECT
  USING (
    video_id IN (
      SELECT id FROM video_uploads 
      WHERE user_id = auth.uid()
    )
  );

-- Create policy for service role to manage all progress
CREATE POLICY "Service role can manage all progress" ON upload_progress
  FOR ALL
  USING (auth.role() = 'service_role');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE upload_progress;