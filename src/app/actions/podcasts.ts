"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import fs from 'fs';
import path from 'path';

export async function updatePodcastGenre(podcastId: string, newGenre: string) {
  try {
    const { getAdminUser } = await import("./admin");
    await getAdminUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("podcasts")
      .update({ genre: newGenre })
      .eq("id", podcastId);

    if (error) {
      console.error("Failed to update podcast genre:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/rankings");
    revalidatePath("/");

    return { success: true };
  } catch (err: any) {
    console.error("Error updating podcast genre:", err);
    return { success: false, error: err.message };
  }
}

export async function updatePodcastLanguage(podcastId: string, newLanguage: string) {
  try {
    const { getAdminUser } = await import("./admin");
    await getAdminUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("podcasts")
      .update({ primary_language: newLanguage })
      .eq("id", podcastId);

    if (error) {
      console.error("Failed to update podcast language:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/rankings");
    revalidatePath("/");

    return { success: true };
  } catch (err: any) {
    console.error("Error updating podcast language:", err);
    return { success: false, error: err.message };
  }
}

export async function updatePodcastStatus(podcastId: string, newStatus: string) {
  try {
    const { getAdminUser } = await import("./admin");
    await getAdminUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("podcasts")
      .update({ status: newStatus })
      .eq("id", podcastId);

    if (error) {
      console.error("Failed to update podcast status:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/rankings");
    revalidatePath("/dashboard");
    revalidatePath("/");

    return { success: true };
  } catch (err: any) {
    console.error("Error updating podcast status:", err);
    return { success: false, error: err.message };
  }
}

export async function togglePodcastScoreVisibility(podcastId: string, currentStatus: boolean) {
  try {
    const { getAdminUser } = await import("./admin");
    await getAdminUser();
    const filepath = path.join(process.cwd(), 'public', 'graviton_data.json');
    let data: any = {};
    try {
      data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch(e) {}
    
    data[podcastId] = { ...(data[podcastId] || {}), is_score_hidden: !currentStatus };
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    revalidatePath("/rankings");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleAllPodcastScoresVisibility(hideAll: boolean) {
  try {
    const { getAdminUser } = await import("./admin");
    await getAdminUser();
    const filepath = path.join(process.cwd(), 'public', 'graviton_data.json');
    let data: any = {};
    try {
      data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch(e) {}
    
    for (const key of Object.keys(data)) {
      if (key !== '_globalSettings') {
        data[key] = { ...(data[key] || {}), is_score_hidden: hideAll };
      }
    }
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    revalidatePath("/rankings");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function swapPodcastRanks(podcast1: { id: string, rank: number }, podcast2: { id: string, rank: number }) {
  try {
    const { getAdminUser } = await import("./admin");
    await getAdminUser();
    const filepath = path.join(process.cwd(), 'public', 'graviton_data.json');
    let data: any = {};
    try {
      data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch(e) {}

    data[podcast1.id] = { ...(data[podcast1.id] || {}), manual_rank: podcast2.rank };
    data[podcast2.id] = { ...(data[podcast2.id] || {}), manual_rank: podcast1.rank };

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    revalidatePath("/rankings");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
