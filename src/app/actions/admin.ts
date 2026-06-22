"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

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

export async function adminSeedPodcast(youtubeUrl: string) {
  try {
    await getAdminUser();
    const adminDbClient = getAdminClient();
    
    const apiKey = process.env.YOUTUBE_API_KEY;
    let showName = youtubeUrl.split('/').pop() || youtubeUrl;
    let description = "";
    let coverArt = "";
    let subscriberCount = 0;
    let genre = "General";
    
    if (apiKey) {
      let channelIdOrHandle = youtubeUrl.split('/').pop()?.split('?')[0] || '';
      let endpoint = '';
      
      if (channelIdOrHandle.startsWith('@')) {
        endpoint = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,topicDetails&forHandle=${encodeURIComponent(channelIdOrHandle)}&key=${apiKey}`;
      } else if (youtubeUrl.includes('/channel/')) {
        const id = youtubeUrl.split('/channel/')[1].split('?')[0];
        endpoint = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,topicDetails&id=${id}&key=${apiKey}`;
      }

      if (endpoint) {
        const res = await fetch(endpoint);
        if (res.ok) {
           const data = await res.json();
           if (data.items && data.items.length > 0) {
              const ch = data.items[0];
              showName = ch.snippet.title;
              description = ch.snippet.description;
              coverArt = ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.default?.url;
              subscriberCount = parseInt(ch.statistics?.subscriberCount || '0');
              
              if (ch.topicDetails?.topicCategories?.length > 0) {
                const topicUrl = ch.topicDetails.topicCategories[0];
                const topicRaw = topicUrl.split('/').pop()?.replace(/_/g, ' ').replace(/\(sociology\)/g, '').trim() || 'General';
                // Simple mapping
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
           }
        }
      }
    }
    
    const { error } = await adminDbClient.from("podcasts").insert({
      status: 'seeded',
      youtube_url: youtubeUrl,
      show_name: showName,
      description: description,
      cover_art_url: coverArt,
      thumbnail_url: coverArt,
      subscriber_count: subscriberCount,
      primary_language: 'Unknown',
      genre: genre
    });
    
    if (error) throw error;
    revalidatePath("/admin/podcasts");
    return { success: true };
  } catch(e:any) {
    console.error("Error seeding podcast:", e);
    return { success: false, error: e.message };
  }
}
