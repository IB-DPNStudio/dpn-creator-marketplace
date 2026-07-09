const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function check() {
  const { data: pl } = await supabase.from("playlist_podcasts").select("*").limit(1);
  console.log("playlist_podcasts columns:", pl ? Object.keys(pl[0]) : "No data");
  
  const { data: ph } = await supabase.from("podcast_history").select("*").limit(1);
  console.log("podcast_history columns:", ph ? (ph.length > 0 ? Object.keys(ph[0]) : "Empty") : "No data");
  
  if (pl && pl.length > 0) {
    console.log("First playlist_podcasts id/playlist_id:", {id: pl[0].id, playlist_id: pl[0].playlist_id});
  }
}

check();
