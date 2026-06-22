import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const apiKey = process.env.YOUTUBE_API_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log("Fetching all podcasts for full refresh test...");
  const { data: podcasts } = await supabase.from("podcasts").select("id, youtube_url, show_name");
  if (!podcasts) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekStr = lastWeek.toISOString().split('T')[0];

  let successCount = 0;
  for (const podcast of podcasts) {
    if (!podcast.youtube_url) continue;
    
    const cleanUrl = podcast.youtube_url.trim().replace(/\/+$/, '');
    let channelIdOrHandle = cleanUrl.split('/').pop()?.split('?')[0] || '';
    let endpoint = '';
    if (channelIdOrHandle.startsWith('@')) {
      endpoint = `https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=${encodeURIComponent(channelIdOrHandle)}&key=${apiKey}`;
    } else if (cleanUrl.includes('/channel/')) {
      endpoint = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIdOrHandle}&key=${apiKey}`;
    }

    if (endpoint) {
      const res = await fetch(endpoint);
      if (res.ok) {
         const data = await res.json();
         if (data.items && data.items.length > 0) {
            const ch = data.items[0];
            const totalViews = parseInt(ch.statistics?.viewCount || '0');
            const subCount = parseInt(ch.statistics?.subscriberCount || '0');
            
            await supabase.from("channel_stats_history").upsert({
              podcast_id: podcast.id,
              recorded_date: todayStr,
              total_views: totalViews,
              subscriber_count: subCount
            }, { onConflict: 'podcast_id, recorded_date' });

            const { data: pastSnapshots } = await supabase
              .from("channel_stats_history")
              .select("total_views")
              .eq("podcast_id", podcast.id)
              .lt("recorded_date", todayStr)
              .gte("recorded_date", lastWeekStr)
              .order("recorded_date", { ascending: true })
              .limit(1);

            let viewsLast7Days = 0;
            if (pastSnapshots && pastSnapshots.length > 0) {
              viewsLast7Days = totalViews - pastSnapshots[0].total_views;
              if (viewsLast7Days < 0) viewsLast7Days = 0;
            }

            await supabase.from("podcasts").update({
              total_views: totalViews,
              subscriber_count: subCount,
              views_last_7_days: viewsLast7Days
            }).eq("id", podcast.id);
            successCount++;
         }
      }
    }
  }
  console.log(`Successfully completed refresh logic for ${successCount} out of ${podcasts.length} podcasts.`);
}
run();
