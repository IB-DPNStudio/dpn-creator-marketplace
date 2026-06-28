import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { calculatePlaylistScore } from "../lib/score_playlist";

async function check() {
  const adminDbClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data } = await adminDbClient
    .from("playlist_podcasts")
    .select("show_name, is_included, final_score")
    .ilike("show_name", "%Shamani%");
    
  console.log("Shamani:", data);
}
check();
