import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function snapshotRanks() {
  console.log("Fetching current podcasts to generate historical snapshot...");
  
  // 1. Fetch all podcasts, sorted by dpn_score to determine global rank
  const { data: podcasts, error: fetchError } = await supabase
    .from("podcasts")
    .select("id, dpn_score, views_last_7_days, subscriber_count")
    .order("dpn_score", { ascending: false });

  if (fetchError) {
    console.error("Error fetching podcasts:", fetchError);
    process.exit(1);
  }

  if (!podcasts || podcasts.length === 0) {
    console.log("No podcasts found to snapshot.");
    return;
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  console.log(`Creating snapshot for date: ${today}`);

  const snapshotRecords = podcasts.map((p, index) => ({
    podcast_id: p.id,
    snapshot_date: today,
    dpn_score: p.dpn_score || 0,
    rank: index + 1, // 1-based global rank
    views_last_7_days: p.views_last_7_days || 0,
    subscriber_count: p.subscriber_count || 0
  }));

  // 2. Insert into podcast_history
  const { error: insertError } = await supabase
    .from("podcast_history")
    .upsert(snapshotRecords, { 
      onConflict: 'podcast_id, snapshot_date',
      ignoreDuplicates: false // Overwrite if we re-run on the same day
    });

  if (insertError) {
    console.error("Error inserting snapshot records:", insertError);
    process.exit(1);
  }

  console.log(`Successfully created snapshot for ${snapshotRecords.length} podcasts.`);
}

snapshotRanks().catch(console.error);
