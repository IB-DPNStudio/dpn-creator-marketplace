"use server";

import { createAdminClient } from "@/utils/supabase/server";

export async function processRefreshPhase() {
  const adminDbClient = createAdminClient();
  
  try {
    // Check if there is an active cycle
    const { data: cycle, error: cycleErr } = await adminDbClient
      .from("refresh_cycles")
      .select("*")
      .eq("status", "running")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cycleErr && cycleErr.code !== 'PGRST116') throw cycleErr; // ignore no rows

    let activeCycle = cycle;

    // If no active cycle, we create one and start Phase 1
    if (!activeCycle) {
      const { data: newCycle, error: insertErr } = await adminDbClient
        .from("refresh_cycles")
        .insert({
          status: 'running',
          current_phase: 1,
          phase_1_completed: false,
          phase_2_completed: false,
          phase_3_completed: false
        })
        .select()
        .single();
      
      if (insertErr) throw insertErr;
      activeCycle = newCycle;
    }

    const { addOrUpdatePlaylistRank } = await import("./labs");

    // Fetch playlists sorted by current score (we'll paginate over them)
    const { data: allPlaylists } = await adminDbClient
      .from("playlist_podcasts")
      .select("playlist_id")
      .in("status", ["seeded", "verified", "approved_partner", "featured_partner"])
      .eq("is_included", true)
      .order("final_score", { ascending: false });

    if (!allPlaylists || allPlaylists.length === 0) {
      return { success: true, message: "No podcasts to process." };
    }

    const phase = activeCycle.current_phase;
    const offset = (phase - 1) * 500;
    const phasePlaylists = allPlaylists.slice(offset, offset + 500);

    // If we have podcasts for this phase, process them
    if (phasePlaylists.length > 0) {
      const batchSize = 5; // Smaller batch size because full fetch is heavy
      for (let i = 0; i < phasePlaylists.length; i += batchSize) {
        const batch = phasePlaylists.slice(i, i + batchSize);
        await Promise.all(batch.map(p => 
          addOrUpdatePlaylistRank({
            playlistUrlOrId: p.playlist_id,
            isIncluded: true,
            fastRefresh: false // Crucial: Set to false to avoid the UU uploads bug!
          })
        ));
      }
    }

    // Advance to next phase
    const updates: any = { last_run_at: new Date().toISOString() };
    if (phase === 1) {
      updates.phase_1_completed = true;
      updates.current_phase = 2;
    } else if (phase === 2) {
      updates.phase_2_completed = true;
      updates.current_phase = 3;
    } else {
      updates.phase_3_completed = true;
      updates.status = 'completed';
    }

    await adminDbClient
      .from("refresh_cycles")
      .update(updates)
      .eq("id", activeCycle.id);

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/admin/podcasts");
    revalidatePath("/rankings");

    return { success: true, phase: phase, processed: phasePlaylists.length, cycleId: activeCycle.id };
  } catch (err: any) {
    console.error("Error in processRefreshPhase:", err);
    return { success: false, error: err.message };
  }
}

export async function getRefreshCycleStatus() {
  const adminDbClient = createAdminClient();
  const { data: cycle, error } = await adminDbClient
    .from("refresh_cycles")
    .select("*")
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    return { success: false, error: error.message };
  }
  return { success: true, cycle };
}
