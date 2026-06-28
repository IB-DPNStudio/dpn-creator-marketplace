import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { calculatePlaylistScore } from "../lib/score_playlist";

import { fetchPlaylistSampleVideos } from "../app/actions/labs";

async function check() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const ids = ["PC1BxwiVRts", "NDvQd5Fg2wg", "e3pZ6LNkNtc", "eeRH5Cawop8", "NUKX5dMTwzo"];
  for (const id of ids) {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${id}&key=${apiKey}`);
    const data = await res.json();
    console.log(`Video ID: ${id}, exists:`, data.items?.length > 0, "status:", data.items?.[0]?.status || "Not Found");
  }
}
check();
