-- Drop old foreign key constraint pointing to podcasts table
ALTER TABLE public.podcast_history 
DROP CONSTRAINT IF EXISTS podcast_history_podcast_id_fkey;

-- Add new foreign key constraint pointing to playlist_podcasts
ALTER TABLE public.podcast_history 
ADD CONSTRAINT podcast_history_podcast_id_fkey 
FOREIGN KEY (podcast_id) 
REFERENCES public.playlist_podcasts(id) 
ON DELETE CASCADE;

-- Also update ranking_history constraint just in case it is used
ALTER TABLE public.ranking_history 
DROP CONSTRAINT IF EXISTS ranking_history_podcast_id_fkey;

ALTER TABLE public.ranking_history 
ADD CONSTRAINT ranking_history_podcast_id_fkey 
FOREIGN KEY (podcast_id) 
REFERENCES public.playlist_podcasts(id) 
ON DELETE CASCADE;
