const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function checkOldHistory() {
  const { data: hist } = await supabase.from("podcast_history").select("*");
  console.log("Total podcast_history records:", hist ? hist.length : 0);
  
  if (hist && hist.length > 0) {
    const dates = new Set(hist.map(h => h.snapshot_date));
    console.log("Snapshot dates:", Array.from(dates));
  }
}

checkOldHistory();
