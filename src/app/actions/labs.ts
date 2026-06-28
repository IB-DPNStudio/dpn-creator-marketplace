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

export async function getLabsPlaylists(statusIn?: string[]) {
  const adminDbClient = getAdminClient();
  let allData: any[] = [];
  let from = 0;
  const step = 999;
  let hasMore = true;

  while (hasMore) {
    let query = adminDbClient
      .from("playlist_podcasts")
      .select("*")
      .eq("is_included", true)
      .order("final_score", { ascending: false })
      .range(from, from + step);

    if (statusIn && statusIn.length > 0) {
      query = query.in("status", statusIn);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    if (data && data.length > 0) {
      allData = allData.concat(data);
      from += step + 1;
    } else {
      hasMore = false;
    }
  }

  const data = allData;
  
  // Filter out playlists older than 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const filteredData = (data || []).filter(p => {
    if (!p.latest_episode_date) return false;
    return new Date(p.latest_episode_date) >= ninetyDaysAgo;
  });

  // Fetch channel names and descriptions from the main podcasts table
  const channelIds = [...new Set(filteredData.map(p => p.channel_id).filter(Boolean))];
  let channelMap = new Map();
  let channelDescMap = new Map();
  
  if (channelIds.length > 0) {
    // Chunk the requests to avoid URL length limits or PostgREST constraints
    const chunkSize = 100;
    for (let i = 0; i < channelIds.length; i += chunkSize) {
      const chunk = channelIds.slice(i, i + chunkSize);
      const { data: podData } = await adminDbClient
        .from("podcasts")
        .select("channel_id, show_name, description")
        .in("channel_id", chunk);
        
      if (podData) {
        podData.forEach(p => {
          if (p.channel_id) {
            if (p.show_name) channelMap.set(p.channel_id, p.show_name);
            if (p.description) channelDescMap.set(p.channel_id, p.description);
          }
        });
      }
    }
  }

  return filteredData.map(p => ({
    ...p,
    channel_name: channelMap.get(p.channel_id) || "YouTube Channel",
    channel_description: channelDescMap.get(p.channel_id) || ""
  }));
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
    const thumbnailUrl = snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || null;

    // 2. Fetch Playlist Items for stats
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalEpisodes = 0;
    let latestEpisodeDate: string | null = null;
    let averageDaysBetween = 0;
    
    let allPlaylistItems: any[] = [];
    let pageToken = '';
    let pageCount = 0;
    const MAX_PAGES = 50; // Max 2500 items to avoid rate limits and capture the end of large playlists
    
    while (pageCount < MAX_PAGES) {
      const pageTokenParam = pageToken ? `&pageToken=${pageToken}` : '';
      const itemsRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${playlistId}&maxResults=50${pageTokenParam}&key=${apiKey}`);
      const itemsData = await itemsRes.json();
      
      if (!itemsData.items || itemsData.items.length === 0) break;
      
      allPlaylistItems = allPlaylistItems.concat(itemsData.items);
      totalEpisodes = itemsData.pageInfo?.totalResults || allPlaylistItems.length;
      
      if (itemsData.nextPageToken) {
        pageToken = itemsData.nextPageToken;
        pageCount++;
      } else {
        break;
      }
    }

    if (allPlaylistItems.length > 0) {
      // Sort all fetched items by publishedAt descending to get the newest 50
      allPlaylistItems.sort((a, b) => new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime());
      
      // Take top 50 most recent
      const recentItems = allPlaylistItems.slice(0, 50);
      
      latestEpisodeDate = recentItems[0].snippet.publishedAt;
      
      const videoIds = recentItems.map((i: any) => i.contentDetails.videoId).join(',');
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
      if (recentItems.length > 1) {
        const firstDate = new Date(recentItems[0].snippet.publishedAt).getTime();
        const lastDate = new Date(recentItems[recentItems.length - 1].snippet.publishedAt).getTime();
        const diffDays = Math.abs(firstDate - lastDate) / (1000 * 3600 * 24);
        averageDaysBetween = diffDays / (recentItems.length - 1);
      }
    }

    const numSampled = Math.min(allPlaylistItems.length, 50) || 1;
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
      sample_video_titles: allPlaylistItems.slice(0, 50).map((i: any) => i.snippet.title),
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
        thumbnail_url: thumbnailUrl,
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.email !== "studio@ideabrews.com") {
      throw new Error("Unauthorized: Only super admins can delete playlists.");
    }

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

export async function fetchPlaylistSampleVideos(playlistId: string) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error("Missing YouTube API Key");

    const itemsRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=5&key=${apiKey}`);
    const itemsData = await itemsRes.json();

    if (!itemsData.items) {
      return { success: true, videos: [] };
    }

    const videos = itemsData.items.map((item: any) => ({
      title: item.snippet.title,
      videoId: item.contentDetails.videoId,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
      views: 0,
      likes: 0,
      comments: 0
    }));

    if (videos.length > 0) {
      const videoIds = videos.map((v: any) => v.videoId).join(',');
      const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`);
      const vData = await vRes.json();
      
      if (vData.items) {
        vData.items.forEach((vStat: any) => {
          const v = videos.find((video: any) => video.videoId === vStat.id);
          if (v) {
            v.views = parseInt(vStat.statistics?.viewCount || '0');
            v.likes = parseInt(vStat.statistics?.likeCount || '0');
            v.comments = parseInt(vStat.statistics?.commentCount || '0');
          }
        });
      }
    }

    return { success: true, videos };
  } catch (err: any) {
    console.error("Error fetching sample videos:", err);
    return { success: false, error: err.message };
  }
}
export async function updateLabsPlaylistGenre(playlistId: string, genre: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.email !== "studio@ideabrews.com") {
      throw new Error("Unauthorized");
    }

    const adminDbClient = getAdminClient();
    const { error } = await adminDbClient
      .from("playlist_podcasts")
      .update({ genre })
      .eq("playlist_id", playlistId);
      
    if (error) throw error;
    
    revalidatePath("/labs");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateLabsPlaylistLanguage(playlistId: string, language: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.email !== "studio@ideabrews.com") {
      throw new Error("Unauthorized");
    }

    const adminDbClient = getAdminClient();
    const { error } = await adminDbClient
      .from("playlist_podcasts")
      .update({ primary_language: language })
      .eq("playlist_id", playlistId);
      
    if (error) throw error;
    
    revalidatePath("/labs");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
