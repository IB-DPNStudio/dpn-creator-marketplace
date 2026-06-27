import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiKey = process.env.YOUTUBE_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Starting Thumbnail Backfill...");

  const { data: playlists, error } = await supabase
    .from("playlist_podcasts")
    .select("id, playlist_id, show_name")
    .is("thumbnail_url", null);

  if (error) {
    console.error("Error fetching playlists:", error);
    return;
  }

  console.log(`Found ${playlists.length} playlists needing thumbnails.`);

  for (const playlist of playlists) {
    try {
      const pRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlist.playlist_id}&key=${apiKey}`
      );
      const pData = await pRes.json();
      
      if (pData.items && pData.items.length > 0) {
        const snippet = pData.items[0].snippet;
        const thumbnailUrl = snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || null;

        if (thumbnailUrl) {
          const { error: updateErr } = await supabase
            .from("playlist_podcasts")
            .update({ thumbnail_url: thumbnailUrl })
            .eq("id", playlist.id);

          if (updateErr) {
            console.error(`Failed to update ${playlist.show_name}:`, updateErr.message);
          } else {
            console.log(`Updated ${playlist.show_name}`);
          }
        }
      }
    } catch (e: any) {
      console.error(`Error processing ${playlist.show_name}:`, e.message);
    }
  }
  
  console.log("Finished backfilling thumbnails!");
}

main();
