import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Bypass WebSocket error in Node < 22 (since snapshot_ranks doesn't use realtime)
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class {} as any;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function snapshotRanks() {
  console.log("Fetching current playlist podcasts to generate historical snapshot...");
  
  // 1. Fetch all playlist_podcasts, sorted by final_score to determine global rank
  const { data: playlists, error: fetchError } = await supabase
    .from("playlist_podcasts")
    .select("id, final_score, total_views, average_views_per_episode")
    .eq("is_included", true)
    .order("final_score", { ascending: false });

  if (fetchError) {
    console.error("Error fetching playlists:", fetchError);
    process.exit(1);
  }

  if (!playlists || playlists.length === 0) {
    console.log("No playlists found to snapshot.");
    return;
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  console.log(`Creating snapshot for date: ${today}`);

  const snapshotRecords = playlists.map((p, index) => ({
    podcast_id: p.id,
    snapshot_date: today,
    dpn_score: p.final_score || 0,
    rank: index + 1, // 1-based global rank
    views_last_7_days: Math.round(p.average_views_per_episode || 0),
    subscriber_count: 0
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

  console.log(`Successfully created snapshot for ${snapshotRecords.length} playlists.`);
}

snapshotRanks().catch(console.error);
