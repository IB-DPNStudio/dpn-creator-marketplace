const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function deleteFakeData() {
  const { error, count } = await supabase
    .from("podcast_history")
    .delete({ count: 'exact' })
    .eq("snapshot_date", "2026-06-29");
    
  if (error) {
    console.error("Error deleting fake data:", error);
  } else {
    console.log(`Successfully deleted ${count} fake historical records.`);
  }
}

deleteFakeData();
