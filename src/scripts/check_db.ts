import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const adminDbClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Fetch all to update thumbnails
  const { data: allPlaylists } = await adminDbClient.from("playlist_podcasts").select("id, thumbnail_url");
  if (allPlaylists) {
    for (const p of allPlaylists) {
      if (p.thumbnail_url && p.thumbnail_url.includes("mqdefault.jpg")) {
        const hqUrl = p.thumbnail_url.replace("mqdefault.jpg", "maxresdefault.jpg");
        await adminDbClient.from("playlist_podcasts").update({ thumbnail_url: hqUrl }).eq("id", p.id);
      } else if (p.thumbnail_url && p.thumbnail_url.includes("default.jpg") && !p.thumbnail_url.includes("maxresdefault.jpg")) {
        const hqUrl = p.thumbnail_url.replace("default.jpg", "maxresdefault.jpg");
        await adminDbClient.from("playlist_podcasts").update({ thumbnail_url: hqUrl }).eq("id", p.id);
      }
    }
  }

  const { data, error } = await adminDbClient
    .from("playlist_podcasts")
    .select("show_name, thumbnail_url")
    .limit(5);
  console.log("Error:", error);
  console.log("Data count:", data?.length);
  console.log("Data:", data);
}
check();
