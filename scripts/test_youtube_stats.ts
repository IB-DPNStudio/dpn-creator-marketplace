import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const apiKey = process.env.YOUTUBE_API_KEY!;
// Playlist ID from the screenshot: "Unstoppable Woman Season 3" 
// Let's first search YouTube for this channel and playlist. I don't have the playlist ID, so let's just query supabase for it.

import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const playlistId = "PLdJ7SMcmiKXvMUsOyq8z_jrT3YajNKAKi"; // Unstoppable Woman Season 1, 2
  
  const itemsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}`
  );
  const itemsData = await itemsRes.json();
  
  if (itemsData.error) {
    console.error("API Error:", itemsData.error);
    return;
  }
  
  const videoIds = itemsData.items.map((i: any) => i.contentDetails.videoId).join(",");
  console.log("Video IDs:", videoIds);
  
  const vRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`
  );
  const vData = await vRes.json();
  
  console.log("Videos Data:", vData.items?.map((v: any) => v.statistics));
}
test();
