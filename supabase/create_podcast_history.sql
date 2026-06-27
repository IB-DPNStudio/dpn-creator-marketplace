-- Create the podcast_history table to store weekly snapshots
CREATE TABLE IF NOT EXISTS public.podcast_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    podcast_id UUID NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    dpn_score NUMERIC(10,2) NOT NULL,
    rank INTEGER NOT NULL,
    views_last_7_days BIGINT,
    subscriber_count BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure only one snapshot per podcast per week (or day)
    UNIQUE(podcast_id, snapshot_date)
);

-- Indexes for fast lookups by podcast and date
CREATE INDEX IF NOT EXISTS idx_podcast_history_podcast_id ON public.podcast_history(podcast_id);
CREATE INDEX IF NOT EXISTS idx_podcast_history_snapshot_date ON public.podcast_history(snapshot_date);

-- Set up RLS (Row Level Security)
ALTER TABLE public.podcast_history ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access
CREATE POLICY "Allow public read access on podcast_history" 
    ON public.podcast_history FOR SELECT 
    USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access on podcast_history" 
    ON public.podcast_history FOR ALL 
    USING (true)
    WITH CHECK (true);
