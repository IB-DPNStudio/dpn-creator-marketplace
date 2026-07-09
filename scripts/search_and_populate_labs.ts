import { createClient } from "@supabase/supabase-js";
import { calculatePlaylistScore, PlaylistScoreInput } from "../src/lib/score_playlist";
import fetch from "node-fetch";
import WebSocket from 'ws';

require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiKey = process.env.YOUTUBE_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: {
    transport: WebSocket,
  },
});

async function main() {
  console.log("Starting Auto-Populate from YouTube Search...");

  try {
    // Search YouTube for playlists related to "podcast" in India
    // Note: YouTube Search API doesn't support 'podcastStatus', so we use keyword + region
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&q=podcast&regionCode=IN&maxResults=50&key=${apiKey}`
    );
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
      console.log("No playlists found via search.");
      return;
    }

    console.log(`Found ${searchData.items.length} playlists via search. Processing...`);

    for (const item of searchData.items) {
      const playlistId = item.id.playlistId;
      const showName = item.snippet.title;
      const channelId = item.snippet.channelId;
      const description = item.snippet.description;
      const thumbnailUrl = item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || null;

      console.log(`\n-> Evaluating Playlist: ${showName}`);

      // Optional: Heuristic check - verify it actually mentions podcast or is likely one
      if (
        !showName.toLowerCase().includes("podcast") && 
        !description.toLowerCase().includes("podcast") &&
        !item.snippet.channelTitle.toLowerCase().includes("podcast")
      ) {
        console.log(`   Skipping: Doesn't clearly match podcast heuristics.`);
        continue;
      }

      // Fetch Playlist Items for stats
      let totalViews = 0;
      let totalLikes = 0;
      let totalComments = 0;
      let totalEpisodes = 0;
      let latestEpisodeDate: string | null = null;
      let averageDaysBetween = 0;

      const itemsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}`
      );
      const itemsData = await itemsRes.json();

      if (itemsData.items && itemsData.items.length > 0) {
        totalEpisodes = itemsData.pageInfo?.totalResults || itemsData.items.length;
        latestEpisodeDate = itemsData.items[0].snippet.publishedAt;

        const videoIds = itemsData.items
          .map((i: any) => i.contentDetails.videoId)
          .join(",");
        const vRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`
        );
        const vData = await vRes.json();

        if (vData.items) {
          for (const v of vData.items) {
            totalViews += parseInt(v.statistics?.viewCount || "0");
            totalLikes += parseInt(v.statistics?.likeCount || "0");
            totalComments += parseInt(v.statistics?.commentCount || "0");
          }
        }

        if (itemsData.items.length > 1) {
          const firstDate = new Date(itemsData.items[0].snippet.publishedAt).getTime();
          const lastDate = new Date(
            itemsData.items[itemsData.items.length - 1].snippet.publishedAt
          ).getTime();
          const diffDays = Math.abs(firstDate - lastDate) / (1000 * 3600 * 24);
          averageDaysBetween = diffDays / (itemsData.items.length - 1);
        }
      }

      const numSampled = (vData && vData.items && vData.items.length > 0) ? vData.items.length : 1;
      const avgViews = totalViews / numSampled;
      const avgLikes = totalLikes / numSampled;
      const avgComments = totalComments / numSampled;

      if (totalEpisodes < 6) {
        console.log(`   Skipping: Only ${totalEpisodes} episodes (needs at least 6)`);
        continue;
      }

      const scoreInput: PlaylistScoreInput = {
        playlist_id: playlistId,
        total_episodes: totalEpisodes,
        latest_episode_date: latestEpisodeDate,
        average_days_between_episodes: averageDaysBetween,
        total_views: totalViews,
        average_views_per_episode: avgViews,
        average_likes_per_episode: avgLikes,
        average_comments_per_episode: avgComments,
        manual_boost: 0,
        manual_penalty: 0,
        show_name: showName,
        description: description,
        sample_video_titles: itemsData.items ? itemsData.items.map((i: any) => i.snippet.title) : [],
      };

      const { final_score, breakdown, explanations } = calculatePlaylistScore(scoreInput);

      // Only include decent scoring playlists to avoid complete junk (e.g., threshold of 20)
      if (final_score < 20) {
         console.log(`   Skipping: Score too low (${final_score})`);
         continue;
      }

      const { error: upsertErr } = await supabase
        .from("playlist_podcasts")
        .upsert(
          {
            playlist_id: playlistId,
            channel_id: channelId,
            show_name: showName,
            description: description,
            thumbnail_url: thumbnailUrl,
            primary_language: "Unknown", // Can't easily determine from search API
            country: "IN",
            genre: "Podcast",
            total_episodes: totalEpisodes,
            latest_episode_date: latestEpisodeDate,
            average_days_between_episodes: averageDaysBetween,
            total_views: totalViews,
            average_views_per_episode: avgViews,
            average_likes_per_episode: avgLikes,
            average_comments_per_episode: avgComments,
            manual_boost: scoreInput.manual_boost,
            manual_penalty: scoreInput.manual_penalty,
            is_included: true,
            notes: "Auto-populated via YouTube Search (IN)",
            final_score: final_score,
            score_breakdown: breakdown,
            explanations: explanations,
          },
          { onConflict: "playlist_id" }
        );

      if (upsertErr) {
        console.error(`   Failed to insert ${showName}:`, upsertErr.message);
      } else {
        console.log(`   Successfully ingested ${showName} [Score: ${final_score}]`);
      }
    }
  } catch (err: any) {
    console.error("Error searching and populating:", err.message);
  }

  console.log("\nFinished auto-population.");
}

main();
