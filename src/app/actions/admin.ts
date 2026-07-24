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

export async function getAdminUser() {
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

    // 2. Insert playlist
    const playlistIdMatch = data.youtubeUrl.match(/[?&]list=([^&]+)/);
    const playlistId = playlistIdMatch ? playlistIdMatch[1] : data.youtubeUrl;

    const { error: podcastErr } = await adminDbClient
      .from("playlist_podcasts")
      .insert({
        owner_id: ownerId,
        status: 'approved_partner', // Directly approved
        show_name: data.showName,
        description: data.description,
        primary_language: data.language,
        genre: data.genre,
        playlist_id: playlistId,
        is_included: true,
      });

    if (podcastErr) throw podcastErr;
    revalidatePath("/dashboard");
    revalidatePath("/admin/users");
    revalidatePath("/admin/approvals");
    return { success: true };
  } catch (err: any) {
    console.error("Error in adminCreateCreator:", err);
    const errorMessage = err.message && typeof err.message === 'string' ? err.message : JSON.stringify(err);
    return { 
      success: false, 
      error: errorMessage === '{}' ? 'Failed to send invitation. The user may have already been invited or the email rate limit was reached.' : errorMessage 
    };
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
    const errorMessage = err.message && typeof err.message === 'string' ? err.message : JSON.stringify(err);
    return { 
      success: false, 
      error: errorMessage === '{}' ? 'Failed to send invitation. The user may have already been invited or the email rate limit was reached.' : errorMessage 
    };
  }
}

export async function togglePodcastFeatured(id: string, currentlyFeatured: boolean) {
  try {
    await getAdminUser();
    const adminDbClient = getAdminClient();
    
    const newStatus = currentlyFeatured ? 'seeded' : 'featured_partner';
    
    const { error } = await adminDbClient
      .from("playlist_podcasts")
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
      .from("playlist_podcasts")
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

import { addOrUpdatePlaylistRank } from "./labs";

export async function adminSeedPodcast(youtubeUrl: string, creatorEmail?: string) {
  try {
    await getAdminUser();
    const adminDbClient = getAdminClient();
    
    // Call the labs function to fetch and rank the playlist
    const res = await addOrUpdatePlaylistRank({
      playlistUrlOrId: youtubeUrl,
      isIncluded: true
    });
    
    if (!res.success) {
      throw new Error(res.error || "Failed to seed playlist");
    }
    
    // Extract playlist ID from URL
    const playlistIdMatch = youtubeUrl.match(/[?&]list=([^&]+)/);
    const playlistId = playlistIdMatch ? playlistIdMatch[1] : youtubeUrl;
    
    // Update the contact email and status in playlist_podcasts
    if (creatorEmail) {
      const { error: updateErr } = await adminDbClient
        .from("playlist_podcasts")
        .update({ contact_email: creatorEmail, status: 'seeded' })
        .eq("playlist_id", playlistId);
        
      if (updateErr) throw updateErr;
    } else {
      const { error: updateErr } = await adminDbClient
        .from("playlist_podcasts")
        .update({ status: 'seeded' })
        .eq("playlist_id", playlistId);
        
      if (updateErr) throw updateErr;
    }
    
    // Fetch the stored record to return data
    const { data: storedData } = await adminDbClient
      .from("playlist_podcasts")
      .select("final_score, genre, show_name")
      .eq("playlist_id", playlistId)
      .single();
    
    revalidatePath("/admin/podcasts");
    revalidatePath("/rankings");
    revalidatePath("/dashboard");
    
    return { 
      success: true, 
      data: { 
        dpnScore: storedData?.final_score?.toFixed(1) || "N/A", 
        genre: storedData?.genre || "General", 
        showName: storedData?.show_name || "Playlist" 
      } 
    };
  } catch(e:any) {
    console.error("Error seeding playlist:", e);
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
      .from("playlist_podcasts")
      .update({ 
        contact_email: email,
        claim_emails_sent: 0
      })
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
      .from("playlist_podcasts")
      .select("id, contact_email, show_name, thumbnail_url, claim_emails_sent")
      .eq("id", id)
      .single();
      
    if (fetchErr || !podcast) throw new Error("Podcast not found");
    if (!podcast.contact_email) throw new Error("No contact email associated with this podcast");
    
    const { sendClaimEmail } = await import('@/lib/email');
    await sendClaimEmail(podcast.contact_email, podcast.show_name, podcast.thumbnail_url || '', podcast.id);
    
    const { error: updateErr } = await adminDbClient
      .from("playlist_podcasts")
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

export async function unclaimPodcast(id: string) {
  try {
    await getAdminUser();
    const adminDbClient = getAdminClient();
    
    const { error } = await adminDbClient
      .from("playlist_podcasts")
      .update({ 
        owner_id: null
      })
      .eq("id", id);
      
    if (error) throw error;
    
    revalidatePath("/admin/podcasts");
    return { success: true };
  } catch (err: any) {
    console.error("Error unclaiming podcast:", err);
    return { success: false, error: err.message };
  }
}
