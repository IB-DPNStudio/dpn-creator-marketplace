import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

function detectLanguage(title: string, desc: string): string {
  const combined = (title + " " + desc).toLowerCase();
  
  if (/[\u0900-\u097F]/.test(combined)) return "Hindi"; // Hindi/Devanagari
  if (/[\u0D00-\u0D7F]/.test(combined)) return "Malayalam"; // Malayalam
  if (/[\u0C00-\u0C7F]/.test(combined)) return "Telugu"; // Telugu
  if (/[\u0B80-\u0BFF]/.test(combined)) return "Tamil"; // Tamil
  if (/[\u0C80-\u0CFF]/.test(combined)) return "Kannada"; // Kannada
  if (/[\u0980-\u09FF]/.test(combined)) return "Bengali"; // Bengali
  if (/[\u0A80-\u0AFF]/.test(combined)) return "Gujarati"; // Gujarati

  // Check common language keywords in description
  if (combined.includes("malayalam") || combined.includes("കേരള")) return "Malayalam";
  if (combined.includes("hindi") || combined.includes("भारत") || combined.includes("हिंदी")) return "Hindi";
  if (combined.includes("telugu")) return "Telugu";
  if (combined.includes("tamil")) return "Tamil";
  if (combined.includes("kannada")) return "Kannada";

  return "English"; // Default fallback
}

function detectGenre(title: string, desc: string): string {
  const combined = (title + " " + desc).toLowerCase();
  
  if (combined.includes("news") || combined.includes("politics") || combined.includes("political") || combined.includes("reaction") || combined.includes("ndtv") || combined.includes("shajan")) {
    return "News & Current Affairs";
  }
  if (combined.includes("money") || combined.includes("finance") || combined.includes("investing") || combined.includes("business") || combined.includes("kamath") || combined.includes("wtf is")) {
    return "Business & Finance";
  }
  if (combined.includes("comedy") || combined.includes("funny") || combined.includes("roast") || combined.includes("rofl") || combined.includes("chuckle") || combined.includes("entertainment") || combined.includes("bhakthan")) {
    return "Comedy & Entertainment";
  }
  if (combined.includes("spirituality") || combined.includes("spiritual") || combined.includes("god") || combined.includes("bhakti") || combined.includes("religion") || combined.includes("hindu")) {
    return "Spirituality & Wellness";
  }
  if (combined.includes("tech") || combined.includes("science") || combined.includes("technology") || combined.includes("coding")) {
    return "Science & Technology";
  }
  if (combined.includes("history") || combined.includes("historical") || combined.includes("rome") || combined.includes("civilization")) {
    return "History";
  }
  if (combined.includes("crime") || combined.includes("murder") || combined.includes("detective") || combined.includes("true crime")) {
    return "True Crime";
  }

  // Fallback defaults
  if (combined.includes("dostcast") || combined.includes("podcast") || combined.includes("talk") || combined.includes("chat") || combined.includes("conversation") || combined.includes("show")) {
    return "Society & Culture";
  }

  return "Society & Culture"; // Clean general fallback
}

async function fix() {
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
      .select("id, show_name, description, genre, primary_language, country")
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

  console.log(`Found ${playlists.length} playlists. Processing missing metadata...`);
  let updateCount = 0;

  for (const p of playlists) {
    let needsUpdate = false;
    const updates: Record<string, any> = {};

    const title = p.show_name || "";
    const desc = p.description || "";

    if (!p.genre || p.genre === "General" || p.genre === "Unknown") {
      updates.genre = detectGenre(title, desc);
      needsUpdate = true;
    }

    if (!p.primary_language || p.primary_language === "Unknown" || p.primary_language === "General") {
      updates.primary_language = detectLanguage(title, desc);
      needsUpdate = true;
    }

    if (needsUpdate) {
      const { error: updateError } = await adminDbClient
        .from("playlist_podcasts")
        .update(updates)
        .eq("id", p.id);

      if (updateError) {
        console.error(`Failed to update ${p.id}:`, updateError);
      } else {
        updateCount++;
      }
    }
  }

  console.log(`Successfully classified and updated ${updateCount} playlists!`);
}

fix();
