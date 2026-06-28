import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const genreMapping: Record<string, string> = {
  "Geopolitics": "News & Current Affairs",
  "Lifestyle": "Society & Culture",
  "Spirituality": "Religion & Spirituality",
  "Self-help": "Society & Culture",
  "Spirituality & Wellness": "Religion & Spirituality",
  "Podcast": "Society & Culture"
};

async function clean() {
  const adminDbClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("Fetching all playlist podcasts...");
  let playlists: any[] = [];
  let from = 0;
  let step = 999;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await adminDbClient
      .from("playlist_podcasts")
      .select("id, genre")
      .range(from, from + step);

    if (error) {
      console.error("Error fetching playlists:", error);
      return;
    }

    if (data && data.length > 0) {
      playlists = playlists.concat(data);
      from += step + 1;
    } else {
      hasMore = false;
    }
  }

  console.log(`Found ${playlists.length} playlists. Cleaning genres...`);
  let updateCount = 0;

  for (const p of playlists) {
    if (p.genre && genreMapping[p.genre]) {
      const targetGenre = genreMapping[p.genre];
      const { error: updateError } = await adminDbClient
        .from("playlist_podcasts")
        .update({ genre: targetGenre })
        .eq("id", p.id);

      if (updateError) {
        console.error(`Failed to update genre for ${p.id}:`, updateError);
      } else {
        updateCount++;
      }
    }
  }

  console.log(`Successfully mapped and updated ${updateCount} playlists with standard genres!`);
}

clean();
