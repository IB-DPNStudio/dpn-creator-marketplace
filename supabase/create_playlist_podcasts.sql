-- supabase/create_playlist_podcasts.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE playlist_podcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id VARCHAR NOT NULL UNIQUE,
    channel_id VARCHAR,
    show_name VARCHAR NOT NULL,
    description TEXT,
    primary_language VARCHAR,
    country VARCHAR,
    genre VARCHAR,
    
    -- Catalog Depth
    total_episodes INT DEFAULT 0,
    
    -- Freshness
    latest_episode_date TIMESTAMP WITH TIME ZONE,
    average_days_between_episodes FLOAT,
    
    -- Engagement (Aggregated from recent episodes)
    total_views BIGINT DEFAULT 0,
    average_views_per_episode FLOAT DEFAULT 0,
    average_likes_per_episode FLOAT DEFAULT 0,
    average_comments_per_episode FLOAT DEFAULT 0,
    
    -- Manual Overrides
    manual_boost FLOAT DEFAULT 0.0,
    manual_penalty FLOAT DEFAULT 0.0,
    is_included BOOLEAN DEFAULT TRUE,
    notes TEXT,

    -- Scoring Outputs
    final_score FLOAT DEFAULT 0.0,
    score_breakdown JSONB, -- stores component scores
    explanations JSONB, -- top positive/negative reasons
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_playlist_podcasts_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_playlist_podcasts_modtime
    BEFORE UPDATE ON playlist_podcasts
    FOR EACH ROW
    EXECUTE FUNCTION update_playlist_podcasts_modtime();
