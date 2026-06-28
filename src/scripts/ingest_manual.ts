import { addOrUpdatePlaylistRank } from '../app/actions/labs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function ingestManual() {
  const adminDbClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: playlists, error } = await adminDbClient.from("playlist_podcasts").select("playlist_id, show_name").eq("is_included", true).order("final_score", { ascending: false }).limit(5);
  if (error) {
    console.error("Failed to fetch playlists:", error);
    return;
  }
  
  const urls = playlists.map(p => p.playlist_id);
  console.log("Top 5 Playlists to re-calculate:", playlists.map(p => p.show_name).join(", "));

  for (const url of urls) {
    console.log(`\nIngesting: ${url}`);
    try {
      const seedRes = await addOrUpdatePlaylistRank({ playlistUrlOrId: url, isIncluded: true });
      if (seedRes.success) {
        // Mark as seeded
        const playlistIdMatch = url.match(/[?&]list=([^&]+)/);
        const playlistId = playlistIdMatch ? playlistIdMatch[1] : url;
        await adminDbClient.from("playlist_podcasts").update({ status: 'seeded' }).eq("playlist_id", playlistId);
        
        console.log(`✅ Successfully seeded: ${playlistId}`);
      } else {
        console.log(`❌ Failed: ${seedRes.error}`);
      }
    } catch (e: any) {
      console.log(`❌ Error: ${e.message}`);
    }
  }
}

ingestManual();
