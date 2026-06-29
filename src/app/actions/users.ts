"use server";

import { createClient } from "@/utils/supabase/server";
import { addOrUpdatePlaylistRank } from "./labs";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { sendApprovalNotification } from "@/lib/email";

// Admin client using service role key to bypass RLS and use Auth Admin API
const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error("Missing Supabase admin credentials. Please set SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  
  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
};

export async function inviteUser(email: string, role: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Unauthorized");

    // Verify inviter is super_admin or dpn_sales using adminDbClient to bypass RLS
    const adminDbClient = getAdminClient();
    const { data: profile } = await adminDbClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== 'super_admin' && profile?.role !== 'dpn_sales') {
      throw new Error("Unauthorized: Only admins can invite users");
    }

    const adminAuthClient = getAdminClient().auth.admin;

    // Send the invite
    const { data, error } = await adminAuthClient.inviteUserByEmail(email, {
      data: {
        role: role
      }
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        // Find existing user and just update their role
        const { data: allUsers } = await adminAuthClient.listUsers();
        const existingUser = allUsers?.users.find(u => u.email === email);
        if (existingUser) {
          await getAdminClient()
            .from("profiles")
            .upsert({ 
              id: existingUser.id, 
              email: email, 
              role: role,
              updated_at: new Date().toISOString()
            });
            
          await adminAuthClient.updateUserById(existingUser.id, {
            user_metadata: { ...existingUser.user_metadata, role: role }
          });
          
          revalidatePath("/admin/users");
          return { success: true };
        }
      }
      console.error("Invite Error:", error);
      return { success: false, error: error.message };
    }

    if (data?.user?.id) {
      // Small delay to let the trigger run
      await new Promise(r => setTimeout(r, 1000));
      await getAdminClient()
        .from("profiles")
        .update({ role: role })
        .eq("id", data.user.id);
    }

    revalidatePath("/admin/users");
    return { success: true };

  } catch (err: any) {
    console.error("Error inviting user:", err);
    return { success: false, error: err.message };
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Unauthorized");

    // Verify updater is admin using adminDbClient to bypass RLS
    const adminDbClient = getAdminClient();
    const { data: profile } = await adminDbClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== 'super_admin' && profile?.role !== 'dpn_sales') {
      throw new Error("Unauthorized: Only admins can change roles");
    }

    const { error } = await adminDbClient
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);


    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/users");
    return { success: true };

  } catch (err: any) {
    console.error("Error updating role:", err);
    return { success: false, error: err.message };
  }
}

export async function switchUserCategory(targetCategory: 'general' | 'creator' | 'agency', additionalData?: any, claimToken?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Unauthorized");

    const adminDbClient = getAdminClient();

    // 1. Clean up associated data for the categories they are NOT switching to
    if (targetCategory === 'general' || targetCategory === 'agency') {
      // Clean up Creator data (podcasts owned by user)
      const { error: deletePodcastsErr } = await adminDbClient
        .from("podcasts")
        .delete()
        .eq("owner_id", user.id);
      if (deletePodcastsErr) console.error("Error cleaning up podcasts:", deletePodcastsErr);
    }

    if (targetCategory === 'general' || targetCategory === 'creator') {
      // Clean up Agency data
      const { data: agencies } = await adminDbClient
        .from("agencies")
        .select("id")
        .eq("owner_id", user.id);

      if (agencies && agencies.length > 0) {
        const agencyIds = agencies.map(a => a.id);
        // Delete associated EOIs first
        await adminDbClient
          .from("eois")
          .delete()
          .in("agency_id", agencyIds);

        // Delete agencies
        await adminDbClient
          .from("agencies")
          .delete()
          .in("id", agencyIds);
      }
    }

    // 2. Perform target category logic
    if (targetCategory === 'general') {
      // Update profile role
      const { error: profileErr } = await adminDbClient
        .from("profiles")
        .upsert({
          id: user.id,
          role: 'general_user',
          email: user.email,
          updated_at: new Date().toISOString()
        });

      if (profileErr) throw profileErr;
    } 
    else if (targetCategory === 'creator') {
      if (!claimToken && (!additionalData || !additionalData.showName || !additionalData.youtubeUrl)) {
        throw new Error("Missing mandatory creator show information");
      }

      // Update profile
      const { error: profileErr } = await adminDbClient
        .from("profiles")
        .upsert({
          id: user.id,
          role: 'general_user', // Will be upgraded to 'creator' upon approval
          full_name: additionalData.fullName,
          phone: additionalData.phone,
          email: user.email,
          updated_at: new Date().toISOString()
        });

      if (profileErr) throw profileErr;

      if (claimToken) {
        // Verify user is authorized to claim this podcast
        const { data: podcast } = await adminDbClient
          .from("playlist_podcasts")
          .select("contact_email, owner_id")
          .eq("id", claimToken)
          .single();

        if (!podcast) {
          throw new Error("Podcast not found");
        }
        if (podcast.owner_id && podcast.owner_id !== user.id) {
          throw new Error("Podcast is already claimed by another user");
        }
        if (podcast.contact_email?.toLowerCase() !== user.email?.toLowerCase()) {
          throw new Error("Unauthorized: Your email does not match the podcast contact email");
        }

        // Update existing podcast
        const { error: podcastErr } = await adminDbClient
          .from("playlist_podcasts")
          .update({
            owner_id: user.id,
            primary_language: additionalData.language || undefined,
            genre: additionalData.genre || undefined,
            manager_name: additionalData.managerName || null,
            manager_email: additionalData.managerEmail || null,
            manager_phone: additionalData.managerPhone || null,
          })
          .eq("id", claimToken);

        if (podcastErr) throw podcastErr;
      } else {
        // Run ingestion and score immediately
        const rankRes = await addOrUpdatePlaylistRank({
          playlistUrlOrId: additionalData.youtubeUrl,
          title: additionalData.showName,
          description: additionalData.description,
          language: additionalData.language,
          genre: additionalData.genre,
          isIncluded: true
        });

        if (rankRes.is_disqualified) {
          throw new Error("Thank you for your interest! Unfortunately, this playlist does not currently qualify for the DPN Ranker because it hasn't released a new episode in the last 90 days. We require active shows for the marketplace.");
        }

        if (!rankRes.success) {
          throw new Error("Failed to process the YouTube playlist. Please check the URL and try again.");
        }

        // Update the newly ingested podcast with the creator's ownership details
        const { error: podcastErr } = await adminDbClient
          .from("playlist_podcasts")
          .update({
            owner_id: user.id,
            status: 'verified',
            manager_name: additionalData.managerName || null,
            manager_email: additionalData.managerEmail || null,
            manager_phone: additionalData.managerPhone || null,
          })
          .eq("playlist_id", rankRes.playlist_id);

        if (podcastErr) throw podcastErr;
        
        // Notify admin
        await sendApprovalNotification(additionalData.showName, 'Creator', user.email || '');
      }
    } 
    else if (targetCategory === 'agency') {
      if (!additionalData || !additionalData.name || !additionalData.company) {
        throw new Error("Missing mandatory agency company information");
      }

      // Update profile
      const { error: profileErr } = await adminDbClient
        .from("profiles")
        .upsert({
          id: user.id,
          role: 'general_user', // Will be upgraded to 'agency_user' upon approval
          full_name: additionalData.name,
          phone: additionalData.phone,
          email: user.email,
          updated_at: new Date().toISOString()
        });

      if (profileErr) throw profileErr;

      // Insert agency
      const { error: agencyErr } = await adminDbClient
        .from("agencies")
        .insert({
          owner_id: user.id,
          status: 'pending',
          name: additionalData.name,
          company_name: additionalData.company,
          job_title: additionalData.jobTitle,
          email: user.email,
          phone: additionalData.phone,
          annual_media_spend: additionalData.spend,
          agency_type: additionalData.type
        });

      if (agencyErr) throw agencyErr;

      // Notify admin
      await sendApprovalNotification(additionalData.name || additionalData.company, 'Agency', user.email || '');
    }

    revalidatePath("/dashboard");
    revalidatePath("/rankings");
    return { success: true };

  } catch (err: any) {
    console.error("Error switching category:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteUser(targetUserId: string, role: string) {
  try {
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
      throw new Error("Unauthorized: Only admins can delete users");
    }

    // 1. Cleanup specific role data
    if (role === 'creator') {
      // Orphan their podcasts
      await adminDbClient
        .from("podcasts")
        .update({ owner_id: null })
        .eq("owner_id", targetUserId);
      await adminDbClient
        .from("playlist_podcasts")
        .update({ owner_id: null })
        .eq("owner_id", targetUserId);
    } else if (role === 'agency_user' || role === 'pending_agency') {
      // Delete their EOIs
      const { data: agencies } = await adminDbClient
        .from("agencies")
        .select("id")
        .eq("owner_id", targetUserId);

      if (agencies && agencies.length > 0) {
        const agencyIds = agencies.map(a => a.id);
        await adminDbClient
          .from("eois")
          .delete()
          .in("agency_id", agencyIds);

        await adminDbClient
          .from("agencies")
          .delete()
          .in("id", agencyIds);
      }
    }

    // 2. Delete Profile
    await adminDbClient
      .from("profiles")
      .delete()
      .eq("id", targetUserId);

    // 3. Delete from Auth
    const adminAuthClient = getAdminClient().auth.admin;
    const { error: deleteError } = await adminAuthClient.deleteUser(targetUserId);

    if (deleteError) {
      console.error("Auth delete error:", deleteError);
      return { success: false, error: deleteError.message };
    }

    revalidatePath("/admin/users");
    return { success: true };

  } catch (err: any) {
    console.error("Error deleting user:", err);
    return { success: false, error: err.message };
  }
}
