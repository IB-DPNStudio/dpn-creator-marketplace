-- Run this script in your Supabase SQL Editor to support 7-day view tracking.

CREATE TABLE IF NOT EXISTS channel_stats_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
  recorded_date DATE NOT NULL,
  total_views BIGINT NOT NULL,
  subscriber_count BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(podcast_id, recorded_date)
);

ALTER TABLE podcasts
ADD COLUMN IF NOT EXISTS views_last_7_days BIGINT DEFAULT 0;

-- Enable RLS for channel_stats_history
ALTER TABLE channel_stats_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to manage stats
CREATE POLICY "Admins can manage channel stats"
ON channel_stats_history FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'dpn_sales')
  )
);
