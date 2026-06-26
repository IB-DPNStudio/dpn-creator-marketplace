"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { calculatePlaylistScore, PlaylistScoreInput } from "@/lib/score_playlist";
import { createClient } from "@/utils/supabase/server";

// Admin client using service role key
const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase admin credentials");
  return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
};

export async function getLabsPlaylists() {
  const adminDbClient = getAdminClient();
  const { data, error } = await adminDbClient
    .from("playlist_podcasts")
    .select("*")
    .eq("is_included", true)
    .order("final_score", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addOrUpdatePlaylistRank(inputData: any) {
  try {
    const adminDbClient = getAdminClient();
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error("Missing YouTube API Key");

    const playlistUrlOrId = inputData.playlistUrlOrId.trim();
    let playlistId = playlistUrlOrId;

    if (playlistUrlOrId.includes("list=")) {
      const url = new URL(playlistUrlOrId);
      playlistId = url.searchParams.get("list") || playlistId;
    }

    // 1. Fetch Playlist Info
    const pRes = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistId}&key=${apiKey}`);
    const pData = await pRes.json();
    if (!pData.items || pData.items.length === 0) {
      throw new Error("Playlist not found on YouTube.");
    }

    const snippet = pData.items[0].snippet;
    const showName = inputData.title || snippet.title;
    const description = inputData.description || snippet.description;
    const channelId = inputData.channelId || snippet.channelId;

    // 2. Fetch Playlist Items for stats
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalEpisodes = 0;
    let latestEpisodeDate: string | null = null;
    let averageDaysBetween = 0;
    
    const itemsRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}`);
    const itemsData = await itemsRes.json();

    if (itemsData.items && itemsData.items.length > 0) {
      totalEpisodes = itemsData.pageInfo?.totalResults || itemsData.items.length;
      latestEpisodeDate = itemsData.items[0].snippet.publishedAt;
      
      const videoIds = itemsData.items.map((i: any) => i.contentDetails.videoId).join(',');
      const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`);
      const vData = await vRes.json();

      if (vData.items) {
        for (const v of vData.items) {
          totalViews += parseInt(v.statistics?.viewCount || '0');
          totalLikes += parseInt(v.statistics?.likeCount || '0');
          totalComments += parseInt(v.statistics?.commentCount || '0');
        }
      }

      // Calculate average days between episodes (up to 50 recent)
      if (itemsData.items.length > 1) {
        const firstDate = new Date(itemsData.items[0].snippet.publishedAt).getTime();
        const lastDate = new Date(itemsData.items[itemsData.items.length - 1].snippet.publishedAt).getTime();
        const diffDays = Math.abs(firstDate - lastDate) / (1000 * 3600 * 24);
        averageDaysBetween = diffDays / (itemsData.items.length - 1);
      }
    }

    const numSampled = itemsData.items?.length || 1;
    const avgViews = totalViews / numSampled;
    const avgLikes = totalLikes / numSampled;
    const avgComments = totalComments / numSampled;

    // 3. Score calculation
    const scoreInput: PlaylistScoreInput = {
      playlist_id: playlistId,
      total_episodes: totalEpisodes,
      latest_episode_date: latestEpisodeDate,
      average_days_between_episodes: averageDaysBetween,
      total_views: totalViews,
      average_views_per_episode: avgViews,
      average_likes_per_episode: avgLikes,
      average_comments_per_episode: avgComments,
      manual_boost: parseFloat(inputData.manualBoost || '0'),
      manual_penalty: parseFloat(inputData.manualPenalty || '0'),
      show_name: showName,
      description: description,
    };

    const { final_score, breakdown, explanations } = calculatePlaylistScore(scoreInput);

    // 4. Upsert DB
    const { error } = await adminDbClient
      .from("playlist_podcasts")
      .upsert({
        playlist_id: playlistId,
        channel_id: channelId,
        show_name: showName,
        description: description,
        primary_language: inputData.language || 'Unknown',
        country: inputData.country || 'Unknown',
        genre: inputData.genre || 'General',
        total_episodes: totalEpisodes,
        latest_episode_date: latestEpisodeDate,
        average_days_between_episodes: averageDaysBetween,
        total_views: totalViews,
        average_views_per_episode: avgViews,
        average_likes_per_episode: avgLikes,
        average_comments_per_episode: avgComments,
        manual_boost: scoreInput.manual_boost,
        manual_penalty: scoreInput.manual_penalty,
        is_included: inputData.isIncluded !== false,
        notes: inputData.notes || '',
        final_score: final_score,
        score_breakdown: breakdown,
        explanations: explanations
      }, { onConflict: 'playlist_id' });

    if (error) throw error;

    revalidatePath("/labs");
    return { success: true };
  } catch (err: any) {
    console.error("Error in addOrUpdatePlaylistRank:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteLabsPlaylist(playlistId: string) {
  try {
    const adminDbClient = getAdminClient();
    const { error } = await adminDbClient
      .from("playlist_podcasts")
      .delete()
      .eq("playlist_id", playlistId);
      
    if (error) throw error;
    
    revalidatePath("/labs");
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting playlist:", err);
    return { success: false, error: err.message };
  }
}
