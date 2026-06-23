"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { calculateDPNScoreBreakdown } from "@/lib/score";

// Admin client using service role key
const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase admin credentials");
  return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
};

async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const adminDbClient = getAdminClient();
  const { data: profile } = await adminDbClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== 'super_admin' && profile?.role !== 'dpn_sales') {
    throw new Error("Unauthorized: Only admins can perform this action");
  }
  return user;
}


export async function adminCreateCreator(data: any) {
  try {
    await getAdminUser();
    const adminDbClient = getAdminClient();
    
    // 1. Ensure the user exists or invite them
    let ownerId = null;
    if (data.ownerEmail) {
      // Check if user exists in profiles
      const { data: existingProfiles } = await adminDbClient
        .from("profiles")
        .select("id, role")
        .eq("email", data.ownerEmail);
        
      if (existingProfiles && existingProfiles.length > 0) {
        ownerId = existingProfiles[0].id;
        // Update role to creator if not already
        if (existingProfiles[0].role !== 'creator' && existingProfiles[0].role !== 'super_admin') {
          await adminDbClient.from("profiles").update({ role: 'creator', full_name: data.fullName }).eq("id", ownerId);
        }
      } else {
        // User does not exist, send invite using existing users.ts function
        const inviteRes = await adminDbClient.auth.admin.inviteUserByEmail(data.ownerEmail, {
          data: { role: 'creator' }
        });
        if (inviteRes.error) throw inviteRes.error;
        ownerId = inviteRes.data.user.id;
        
        // Wait for trigger to create profile
        await new Promise(r => setTimeout(r, 1500));
        await adminDbClient.from("profiles").update({ role: 'creator', full_name: data.fullName }).eq("id", ownerId);
      }
    }

    // 2. Insert podcast
    const { error: podcastErr } = await adminDbClient
      .from("podcasts")
      .insert({
        owner_id: ownerId,
        status: 'approved_partner', // Directly approved
        show_name: data.showName,
        description: data.description,
        primary_language: data.language,
        genre: data.genre,
        youtube_url: data.youtubeUrl,
        spotify_url: data.spotifyUrl,
        instagram_url: data.instagramUrl,
        linkedin_url: data.linkedinUrl,
        inventory_availability: data.inventoryAvailability || {}
      });

    if (podcastErr) throw podcastErr;
    revalidatePath("/dashboard");
    revalidatePath("/admin/users");
    revalidatePath("/admin/approvals");
    return { success: true };
  } catch (err: any) {
    console.error("Error in adminCreateCreator:", err);
    return { success: false, error: err.message };
  }
}

export async function adminCreateAgency(data: any) {
  try {
    await getAdminUser();
    const adminDbClient = getAdminClient();
    
    // 1. Ensure the user exists or invite them
    let ownerId = null;
    if (data.ownerEmail) {
      // Check if user exists in profiles
      const { data: existingProfiles } = await adminDbClient
        .from("profiles")
        .select("id, role")
        .eq("email", data.ownerEmail);
        
      if (existingProfiles && existingProfiles.length > 0) {
        ownerId = existingProfiles[0].id;
        // Update role to agency_user if not already
        if (existingProfiles[0].role !== 'agency_user' && existingProfiles[0].role !== 'super_admin') {
          await adminDbClient.from("profiles").update({ role: 'agency_user', full_name: data.fullName }).eq("id", ownerId);
        }
      } else {
        // User does not exist, send invite
        const inviteRes = await adminDbClient.auth.admin.inviteUserByEmail(data.ownerEmail, {
          data: { role: 'agency_user' }
        });
        if (inviteRes.error) throw inviteRes.error;
        ownerId = inviteRes.data.user.id;
        
        // Wait for trigger to create profile
        await new Promise(r => setTimeout(r, 1500));
        await adminDbClient.from("profiles").update({ role: 'agency_user', full_name: data.fullName }).eq("id", ownerId);
      }
    }

    // 2. Insert agency
    const { error: agencyErr } = await adminDbClient
      .from("agencies")
      .insert({
        owner_id: ownerId,
        status: 'approved', // Directly approved
        name: data.fullName,
        company_name: data.company,
        job_title: data.jobTitle,
        email: data.ownerEmail,
        phone: data.phone,
        annual_media_spend: data.spend,
        agency_type: data.type
      });

    if (agencyErr) throw agencyErr;
    revalidatePath("/admin/users");
    revalidatePath("/admin/approvals");
    return { success: true };
  } catch (err: any) {
    console.error("Error in adminCreateAgency:", err);
    return { success: false, error: err.message };
  }
}

export async function togglePodcastFeatured(id: string, currentlyFeatured: boolean) {
  try {
    await getAdminUser();
    const adminDbClient = getAdminClient();
    
    const newStatus = currentlyFeatured ? 'seeded' : 'featured_partner';
    
    const { error } = await adminDbClient
      .from("podcasts")
      .update({ status: newStatus })
      .eq("id", id);
      
    if (error) throw error;
    
    revalidatePath("/admin/podcasts");
    revalidatePath("/dashboard");
    revalidatePath("/rankings");
    
    return { success: true };
  } catch (err: any) {
    console.error("Error toggling featured status:", err);
    return { success: false, error: err.message };
  }
}

export async function deletePodcast(id: string) {
  try {
    await getAdminUser();
    const adminDbClient = getAdminClient();
    
    const { error } = await adminDbClient
      .from("podcasts")
      .delete()
      .eq("id", id);
      
    if (error) throw error;
    
    revalidatePath("/admin/podcasts");
    revalidatePath("/dashboard");
    revalidatePath("/rankings");
    
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting podcast:", err);
    return { success: false, error: err.message };
  }
}

export async function adminSeedPodcast(youtubeUrl: string, creatorEmail?: string) {
  try {
    await getAdminUser();
    const adminDbClient = getAdminClient();
    
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("Missing YouTube API Key configuration.");
    }

    let cleanUrl = youtubeUrl.trim().replace(/\/+$/, '');
    
    // Remove standard YouTube subpages if present at the end
    const subpages = ['/videos', '/shorts', '/featured', '/playlists', '/about', '/streams', '/community'];
    for (const subpage of subpages) {
      if (cleanUrl.toLowerCase().endsWith(subpage)) {
        cleanUrl = cleanUrl.substring(0, cleanUrl.length - subpage.length);
      }
    }

    // Clean query parameters from URL for display name fallback
    let fallbackShowName = cleanUrl.split('/').pop()?.split('?')[0] || youtubeUrl;
    let showName = fallbackShowName;
    let description = "";
    let coverArt = "";
    let subscriberCount = 0;
    let totalViews = 0;
    let totalVideos = 0;
    let dpnScore = 0;
    let genre = "General";
    let latestVideoUrl = "";
    let latestShortUrl = "";
    
    let channelIdOrHandle = cleanUrl.split('/').pop()?.split('?')[0] || '';
    if (cleanUrl.includes('/c/')) {
      channelIdOrHandle = cleanUrl.split('/c/')[1].split('?')[0];
    } else if (cleanUrl.includes('/user/')) {
      channelIdOrHandle = cleanUrl.split('/user/')[1].split('?')[0];
    }
    
    let endpoint = '';
    if (channelIdOrHandle.startsWith('UC') && channelIdOrHandle.length === 24) {
      endpoint = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,topicDetails,contentDetails&id=${channelIdOrHandle}&key=${apiKey}`;
    } else {
      const handle = channelIdOrHandle.startsWith('@') ? channelIdOrHandle : `@${channelIdOrHandle}`;
      endpoint = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,topicDetails,contentDetails&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`;
    }

    let fetchedSuccessfully = false;
    if (endpoint) {
      const res = await fetch(endpoint);
      if (res.ok) {
          const data = await res.json();
         if (data.items && data.items.length > 0) {
            fetchedSuccessfully = true;
            const ch = data.items[0];
            const channelId = ch.id;
            showName = ch.snippet.title;
            description = ch.snippet.description;
            coverArt = ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.default?.url;
            subscriberCount = parseInt(ch.statistics?.subscriberCount || '0');
            totalViews = parseInt(ch.statistics?.viewCount || '0');
            totalVideos = parseInt(ch.statistics?.videoCount || '0');
            
            const calc = calculateDPNScoreBreakdown(subscriberCount, totalViews, totalVideos);
            dpnScore = calc.score;
            
            if (ch.topicDetails?.topicCategories?.length > 0) {
              const topicUrl = ch.topicDetails.topicCategories[0];
              const topicRaw = topicUrl.split('/').pop()?.replace(/_/g, ' ').replace(/\(sociology\)/g, '').trim() || 'General';
              const lowerTopic = topicRaw.toLowerCase();
              if (lowerTopic.includes('music')) genre = 'Music';
              else if (lowerTopic.includes('game') || lowerTopic.includes('gaming')) genre = 'Gaming';
              else if (lowerTopic.includes('lifestyle')) genre = 'Lifestyle';
              else if (lowerTopic.includes('entertainment')) genre = 'Entertainment';
              else if (lowerTopic.includes('technology')) genre = 'Technology';
              else if (lowerTopic.includes('business')) genre = 'Business';
              else if (lowerTopic.includes('society')) genre = 'Society & Culture';
              else if (lowerTopic.includes('sports')) genre = 'Sports';
              else if (lowerTopic.includes('knowledge') || lowerTopic.includes('education')) genre = 'Education';
              else genre = topicRaw;
            }

            // Fetch latest shorts and longs
            try {
              const uploadsId = ch.contentDetails?.relatedPlaylists?.uploads;
              if (uploadsId) {
                const pRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=20&key=${apiKey}`);
                const pData = await pRes.json();
                if (pData.items && pData.items.length > 0) {
                  const videoIds = pData.items.map((i:any) => i.contentDetails.videoId).join(',');
                  const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${apiKey}`);
                  const vData = await vRes.json();
                  
                  if (vData.items) {
                    for (const v of vData.items) {
                      const durationStr = v.contentDetails?.duration || '';
                      const title = v.snippet?.title || '';
                      
                      const parseDuration = (d: string) => {
                        const match = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                        if (!match) return 0;
                        return parseInt(match[1] || '0') * 3600 + parseInt(match[2] || '0') * 60 + parseInt(match[3] || '0');
                      };
                      
                      const durationSec = parseDuration(durationStr);
                      const isShort = durationSec <= 180 || title.toLowerCase().includes('#shorts');
                      
                      if (isShort && !latestShortUrl) {
                        latestShortUrl = `https://www.youtube.com/watch?v=${v.id}`;
                      } else if (!isShort && !latestVideoUrl) {
                        latestVideoUrl = `https://www.youtube.com/watch?v=${v.id}`;
                      }
                      if (latestShortUrl && latestVideoUrl) break;
                    }
                  }
                }
              }
            } catch (err) {
              console.error("Failed to fetch latest videos", err);
            }

            // Check for duplicates using channelId or youtubeUrl fallback
            const { data: existingPodcasts } = await adminDbClient
              .from("podcasts")
              .select("id, status, owner_id, show_name, youtube_url, contact_email")
              .or(`channel_id.eq.${channelId},youtube_url.eq.${youtubeUrl},youtube_url.eq.${cleanUrl}`);
            
            const existing = existingPodcasts && existingPodcasts.length > 0 ? existingPodcasts[0] : null;
            
            let error;
            let podcastId = existing?.id;
            
            if (existing) {
              const { error: updateErr } = await adminDbClient
                .from("podcasts")
                .update({
                  show_name: showName,
                  channel_id: channelId,
                  contact_email: creatorEmail || existing.contact_email,
                  description: description,
                  cover_art_url: coverArt,
                  thumbnail_url: coverArt,
                  subscriber_count: subscriberCount,
                  total_views: totalViews,
                  total_videos: totalVideos,
                  dpn_score: dpnScore,
                  genre: genre,
                  latest_video_url: latestVideoUrl,
                  latest_short_url: latestShortUrl,
                  updated_at: new Date().toISOString()
                })
                .eq("id", existing.id);
              error = updateErr;
            } else {
              const { data: insertedPodcast, error: insertErr } = await adminDbClient
                .from("podcasts")
                .insert({
                  status: 'seeded',
                  youtube_url: youtubeUrl,
                  channel_id: channelId,
                  contact_email: creatorEmail || null,
                  show_name: showName,
                  description: description,
                  cover_art_url: coverArt,
                  thumbnail_url: coverArt,
                  subscriber_count: subscriberCount,
                  total_views: totalViews,
                  total_videos: totalVideos,
                  dpn_score: dpnScore,
                  primary_language: 'Unknown',
                  genre: genre,
                  latest_video_url: latestVideoUrl,
                  latest_short_url: latestShortUrl
                })
                .select()
                .single();
              error = insertErr;
              if (insertedPodcast) {
                podcastId = insertedPodcast.id;
              }
            }

            if (error) throw error;
         }
      }
    }
    
    if (!fetchedSuccessfully) {
      throw new Error("YouTube channel not found. Please verify the URL.");
    }
    
    revalidatePath("/admin/podcasts");
    revalidatePath("/rankings");
    revalidatePath("/dashboard");
    return { success: true, data: { dpnScore, genre, showName } };
  } catch(e:any) {
    console.error("Error seeding podcast:", e);
    return { success: false, error: e.message || "An unexpected error occurred." };
  }
}

export async function refreshSevenDayViews() {
  try {
    await getAdminUser();
    const adminDbClient = getAdminClient();
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error("Missing YouTube API Key");

    const { data: podcasts } = await adminDbClient.from("podcasts").select("id, youtube_url, show_name");
    if (!podcasts) return { success: true };

    const todayStr = new Date().toISOString().split('T')[0];
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];

    for (const podcast of podcasts) {
      if (!podcast.youtube_url) continue;
      
      const cleanUrl = podcast.youtube_url.trim().replace(/\/+$/, '');
      let channelIdOrHandle = cleanUrl.split('/').pop()?.split('?')[0] || '';
      let endpoint = '';
      if (channelIdOrHandle.startsWith('@')) {
        endpoint = `https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=${encodeURIComponent(channelIdOrHandle)}&key=${apiKey}`;
      } else if (cleanUrl.includes('/channel/')) {
        endpoint = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIdOrHandle}&key=${apiKey}`;
      }

      if (endpoint) {
        const res = await fetch(endpoint);
        if (res.ok) {
           const data = await res.json();
           if (data.items && data.items.length > 0) {
              const ch = data.items[0];
              const totalViews = parseInt(ch.statistics?.viewCount || '0');
              const subCount = parseInt(ch.statistics?.subscriberCount || '0');
              
              // Upsert today's snapshot
              await adminDbClient.from("channel_stats_history").upsert({
                podcast_id: podcast.id,
                recorded_date: todayStr,
                total_views: totalViews,
                subscriber_count: subCount
              }, { onConflict: 'podcast_id, recorded_date' });

              // Fetch the oldest snapshot within the last 7 days window
              const { data: pastSnapshots } = await adminDbClient
                .from("channel_stats_history")
                .select("total_views")
                .eq("podcast_id", podcast.id)
                .lt("recorded_date", todayStr)
                .gte("recorded_date", lastWeekStr)
                .order("recorded_date", { ascending: true })
                .limit(1);

              let viewsLast7Days = 0;
              if (pastSnapshots && pastSnapshots.length > 0) {
                viewsLast7Days = totalViews - pastSnapshots[0].total_views;
                if (viewsLast7Days < 0) viewsLast7Days = 0;
              }

              // Update podcasts table
              await adminDbClient.from("podcasts").update({
                total_views: totalViews,
                subscriber_count: subCount,
                views_last_7_days: viewsLast7Days
              }).eq("id", podcast.id);
           }
        }
      }
    }
    
    revalidatePath("/admin/podcasts");
    revalidatePath("/rankings");
    return { success: true };
  } catch(e:any) {
    console.error("Error refreshing views:", e);
    return { success: false, error: e.message };
  }
}

export async function updatePodcastEmail(id: string, email: string) {
  try {
    await getAdminUser();
    const adminDbClient = getAdminClient();
    
    const { error } = await adminDbClient
      .from("podcasts")
      .update({ contact_email: email })
      .eq("id", id);
      
    if (error) throw error;
    
    revalidatePath("/admin/podcasts");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating email:", err);
    return { success: false, error: err.message };
  }
}

export async function adminSendClaimEmail(id: string) {
  try {
    await getAdminUser();
    const adminDbClient = getAdminClient();
    
    const { data: podcast, error: fetchErr } = await adminDbClient
      .from("podcasts")
      .select("id, contact_email, show_name, cover_art_url, thumbnail_url, claim_emails_sent")
      .eq("id", id)
      .single();
      
    if (fetchErr || !podcast) throw new Error("Podcast not found");
    if (!podcast.contact_email) throw new Error("No contact email associated with this podcast");
    
    const { sendClaimEmail } = await import('@/lib/email');
    await sendClaimEmail(podcast.contact_email, podcast.show_name, podcast.thumbnail_url || podcast.cover_art_url || '', podcast.id);
    
    const { error: updateErr } = await adminDbClient
      .from("podcasts")
      .update({ 
        claim_emails_sent: (podcast.claim_emails_sent || 0) + 1,
        last_claim_email_sent_at: new Date().toISOString()
      })
      .eq("id", id);
      
    if (updateErr) throw updateErr;
    
    revalidatePath("/admin/podcasts");
    return { success: true };
  } catch (err: any) {
    console.error("Error sending claim email:", err);
    return { success: false, error: err.message };
  }
}
