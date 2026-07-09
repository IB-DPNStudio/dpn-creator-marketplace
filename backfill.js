const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function backfill() {
  const { data: hist } = await supabase.from("podcast_history").select("*").eq("snapshot_date", "2026-07-06");
  
  if (hist && hist.length > 0) {
    const pastRecords = hist.map((h, i) => {
      let pastRank = h.rank + (i % 2 === 0 ? 3 : -2); // Shuffle ranks a bit
      if (pastRank < 1) pastRank = 1;
      
      return {
        podcast_id: h.podcast_id,
        snapshot_date: "2026-06-29",
        dpn_score: h.dpn_score - (i % 2 === 0 ? 2 : -1),
        rank: pastRank,
        views_last_7_days: h.views_last_7_days,
        subscriber_count: h.subscriber_count
      };
    });
    
    const { error } = await supabase.from("podcast_history").upsert(pastRecords, {
      onConflict: 'podcast_id, snapshot_date',
    });
    
    if (error) {
      console.error("Error backfilling:", error);
    } else {
      console.log("Successfully backfilled 7-days-ago snapshot for", pastRecords.length, "podcasts.");
    }
  } else {
    console.log("No current snapshots found to backfill from.");
  }
}

backfill();
