import { createClient } from "@supabase/supabase-js";
import { calculatePlaylistScore, PlaylistScoreInput } from "../src/lib/score_playlist";
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
  console.log("Starting Labs Population Script...");

  // 1. Fetch all existing channels
  const { data: channels, error: fetchErr } = await supabase
    .from("podcasts")
    .select("id, show_name, channel_id, primary_language, country, genre")
    .not("channel_id", "is", null);

  if (fetchErr) {
    console.error("Error fetching channels:", fetchErr);
    return;
  }

  console.log(`Found ${channels.length} channels to process.`);

  for (const channel of channels) {
    console.log(`\nProcessing channel: ${channel.show_name} (${channel.channel_id})`);

    // 2. Fetch playlists for this channel
    try {
      const pRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${channel.channel_id}&maxResults=50&key=${apiKey}`
      );
      const pData = await pRes.json();

      if (!pData.items || pData.items.length === 0) {
        console.log("  No playlists found for this channel.");
        continue;
      }

      for (const playlist of pData.items) {
        const playlistId = playlist.id;
        const showName = playlist.snippet.title;
        const description = playlist.snippet.description;
        const thumbnailUrl = playlist.snippet.thumbnails?.medium?.url || playlist.snippet.thumbnails?.default?.url || null;

        console.log(`  -> Found Playlist: ${showName}`);

        // Fetch playlist items for stats
        let totalViews = 0;
        let totalLikes = 0;
        let totalComments = 0;
        let totalEpisodes = 0;
        let latestEpisodeDate: string | null = null;
        let averageDaysBetween = 0;

        let vDataLength = 0;

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
          vDataLength = vData.items ? vData.items.length : 0;

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
        } // <-- THIS WAS MISSING
        
        if (totalEpisodes < 6) {
          console.log(`     Skipping: Only ${totalEpisodes} episodes (needs at least 6)`);
          continue;
        }

        const numSampled = vDataLength > 0 ? vDataLength : 1;
        const avgViews = totalViews / numSampled;
        const avgLikes = totalLikes / numSampled;
        const avgComments = totalComments / numSampled;

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

        const latestVideoIds = itemsData.items ? itemsData.items.slice(0, 5).map((i: any) => i.contentDetails?.videoId).filter(Boolean) : [];
        const updatedExplanations = {
          ...explanations,
          latest_video_ids: latestVideoIds,
          sample_videos: itemsData.items ? itemsData.items.slice(0, 5).map((i: any) => ({ title: i.snippet?.title, description: i.snippet?.description })) : []
        };

        const { error: upsertErr } = await supabase
          .from("playlist_podcasts")
          .upsert(
            {
              playlist_id: playlistId,
              channel_id: channel.channel_id,
              show_name: showName,
              description: description,
              thumbnail_url: thumbnailUrl,
              primary_language: channel.primary_language || "Unknown",
              country: channel.country || "Unknown",
              genre: channel.genre || "General",
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
              notes: "Auto-extracted from channel",
              final_score: final_score,
              score_breakdown: breakdown,
              explanations: updatedExplanations,
            },
            { onConflict: "playlist_id" }
          );

        if (upsertErr) {
          console.error(`     Failed to insert ${showName}:`, upsertErr.message);
        } else {
          console.log(`     Successfully ingested ${showName} [Score: ${final_score}]`);
        }
      }
    } catch (err: any) {
      console.error(`  Error processing channel ${channel.show_name}:`, err.message);
    }
  }

  console.log("\nFinished population.");
}

main();
