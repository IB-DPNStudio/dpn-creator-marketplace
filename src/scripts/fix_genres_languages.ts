import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function fix() {
  const adminDbClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("Fetching all playlist podcasts...");
  let playlists: any[] = [];
  let from = 0;
  let step = 999;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await adminDbClient
      .from("playlist_podcasts")
      .select("id, playlist_id, channel_id, genre, primary_language, country")
      .range(from, from + step);

    if (error) {
      console.error("Error fetching playlists:", error);
      return;
    }

    if (data && data.length > 0) {
      playlists = playlists.concat(data);
      from += step + 1;
    } else {
      hasMore = false;
    }
  }

  // Find unique channel IDs
  const channelIds = [...new Set(playlists.map(p => p.channel_id).filter(Boolean))];
  console.log(`Found ${playlists.length} playlists across ${channelIds.length} unique channels.`);

  const channelMap = new Map<string, { genre?: string; language?: string; country?: string }>();

  if (channelIds.length > 0) {
    const chunkSize = 100;
    for (let i = 0; i < channelIds.length; i += chunkSize) {
      const chunk = channelIds.slice(i, i + chunkSize);
      const { data: podData } = await adminDbClient
        .from("podcasts")
        .select("channel_id, genre, primary_language, country")
        .in("channel_id", chunk);

      if (podData) {
        podData.forEach(p => {
          if (p.channel_id) {
            channelMap.set(p.channel_id, {
              genre: p.genre || undefined,
              language: p.primary_language || undefined,
              country: p.country || undefined
            });
          }
        });
      }
    }
  }

  console.log("Updating missing genres and languages...");
  let updateCount = 0;

  for (const p of playlists) {
    let needsUpdate = false;
    const updates: Record<string, any> = {};

    const defaults = p.channel_id ? channelMap.get(p.channel_id) : null;

    if (!p.genre || p.genre === "General" || p.genre === "Unknown") {
      if (defaults?.genre) {
        updates.genre = defaults.genre;
        needsUpdate = true;
      }
    }

    if (!p.primary_language || p.primary_language === "Unknown" || p.primary_language === "General") {
      if (defaults?.language) {
        updates.primary_language = defaults.language;
        needsUpdate = true;
      }
    }

    if (!p.country || p.country === "Unknown") {
      if (defaults?.country) {
        updates.country = defaults.country;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      const { error: updateError } = await adminDbClient
        .from("playlist_podcasts")
        .update(updates)
        .eq("id", p.id);

      if (updateError) {
        console.error(`Failed to update ${p.id}:`, updateError);
      } else {
        updateCount++;
      }
    }
  }

  console.log(`Successfully updated ${updateCount} playlists with default genre/language values!`);
}

fix();
