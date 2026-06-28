import { calculatePlaylistScore } from "../lib/score_playlist";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function recalculateAll() {
  const adminDbClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("Fetching all playlists...");
  let playlists: any[] = [];
  let from = 0;
  let step = 999;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await adminDbClient
      .from("playlist_podcasts")
      .select("*")
      .range(from, from + step);
      
    if (error) {
      console.error("Error fetching playlists:", error);
      return;
    }
    
    if (data && data.length > 0) {
      playlists = playlists.concat(data);
      from += step + 1;
    } else {
      hasMore = false;
    }
  }

  console.log(`Found ${playlists.length} playlists. Recalculating...`);

  let count = 0;
  for (const p of playlists) {
    const scoreInput = {
      playlist_id: p.playlist_id,
      total_episodes: p.total_episodes,
      latest_episode_date: p.latest_episode_date,
      average_days_between_episodes: p.average_days_between_episodes,
      total_views: p.total_views,
      average_views_per_episode: p.average_views_per_episode,
      average_likes_per_episode: p.average_likes_per_episode,
      average_comments_per_episode: p.average_comments_per_episode,
      manual_boost: p.manual_boost || 0,
      manual_penalty: p.manual_penalty || 0,
      show_name: p.show_name || "",
      description: p.description || "",
      sample_video_titles: p.sample_video_titles || []
    };

    const { final_score, breakdown, explanations } = calculatePlaylistScore(scoreInput);

    // Maintain the latest_video_ids in explanations if it exists
    const updatedExplanations = {
      ...explanations,
      latest_video_ids: p.explanations?.latest_video_ids || []
    };

    const { error: updateError } = await adminDbClient
      .from("playlist_podcasts")
      .update({
        final_score: final_score,
        score_breakdown: breakdown,
        explanations: updatedExplanations
      })
      .eq("id", p.id);

    if (updateError) {
      console.error(`Error updating playlist ${p.show_name}:`, updateError);
    } else {
      count++;
    }
  }

  console.log(`Successfully recalculated and updated ${count} playlists!`);
}

recalculateAll();
