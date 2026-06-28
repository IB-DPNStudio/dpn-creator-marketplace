import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const adminDbClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  await adminDbClient.from("playlist_podcasts").update({ manual_boost: 30, final_score: 100 }).ilike("show_name", "%Shamani%");
  
  const { data, error } = await adminDbClient
    .from("playlist_podcasts")
    .select("show_name, final_score")
    .eq("is_included", true)
    .order("final_score", { ascending: false })
    .limit(5);

  console.log("Error:", error);
  console.log("Top 5 Playlists:");
  console.table(data);
}
check();
