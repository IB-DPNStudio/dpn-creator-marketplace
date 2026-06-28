import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const adminDbClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Give Raj Shamani a manual boost of 30 because his title lacks the keywords
  await adminDbClient.from("playlist_podcasts").update({ manual_boost: 30, final_score: 100 }).ilike("show_name", "%Shamani%");
  
  const { data, error } = await adminDbClient
    .from("playlist_podcasts")
    .select("*")
    .ilike("show_name", "%Shamani%");
  console.log("Error:", error);
  console.log("Data count:", data?.length);
  console.log("Data:", data);
}
check();
