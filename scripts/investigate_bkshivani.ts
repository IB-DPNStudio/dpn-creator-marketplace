import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: podcasts } = await supabase.from("podcasts").select("*").ilike("show_name", "%Shivani%");
  if (!podcasts || podcasts.length === 0) {
    console.log("No podcast found for BKShivani.");
    return;
  }
  
  const p = podcasts[0];
  console.log("Podcast:", { id: p.id, show_name: p.show_name, youtube_url: p.youtube_url, total_views: p.total_views, views_last_7_days: p.views_last_7_days });
  
  const { data: history } = await supabase.from("channel_stats_history").select("*").eq("podcast_id", p.id).order("recorded_date", { ascending: true });
  console.log("History for BKShivani:");
  console.table(history);
}

run();
