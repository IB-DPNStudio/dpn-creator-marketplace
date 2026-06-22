import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing required environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log("Fetching all podcasts...");
  const { data: podcasts, error } = await supabase.from('podcasts').select('id, total_views, subscriber_count, show_name');
  
  if (error || !podcasts) {
    console.error("Error fetching podcasts:", error);
    return;
  }

  console.log(`Found ${podcasts.length} podcasts. Backfilling snapshot for 2026-06-19...`);
  
  let successCount = 0;
  for (const p of podcasts) {
    // If total_views is 0 or null, we just use 0, but hopefully we've run a refresh first.
    const views = p.total_views || 0;
    const subs = p.subscriber_count || 0;
    
    // Create an artificial past snapshot
    const { error: insertError } = await supabase.from('channel_stats_history').upsert({
      podcast_id: p.id,
      recorded_date: '2026-06-19',
      total_views: views, // using current views as a proxy for past views to avoid API complexity
      subscriber_count: subs
    }, { onConflict: 'podcast_id, recorded_date' });

    if (insertError) {
      console.error(`Failed to backfill ${p.show_name}:`, insertError.message);
    } else {
      successCount++;
    }
  }

  console.log(`Successfully backfilled ${successCount} out of ${podcasts.length} podcasts for June 19, 2026.`);
}

run();
