import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const apiKey = process.env.YOUTUBE_API_KEY;

async function run() {
  const { data: playlists } = await supabase.from('playlist_podcasts').select('channel_id, show_name, thumbnail_url');
  if (!playlists) return;

  const channelIds = [...new Set(playlists.map(p => p.channel_id).filter(Boolean))];
  
  for (const channelId of channelIds) {
    try {
      const cRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`);
      const cData = await cRes.json();
      if (cData.items && cData.items.length > 0) {
        const subCount = parseInt(cData.items[0].statistics?.subscriberCount || '0');
        
        const { data: existing } = await supabase.from('podcasts').select('id').eq('channel_id', channelId).maybeSingle();
        
        if (existing) {
          await supabase.from('podcasts').update({ subscriber_count: subCount }).eq('channel_id', channelId);
          console.log(`Updated ${channelId} to ${subCount}`);
        } else {
          const playlist = playlists.find(p => p.channel_id === channelId);
          await supabase.from('podcasts').insert({
            channel_id: channelId,
            show_name: playlist.show_name,
            subscriber_count: subCount,
            thumbnail_url: playlist.thumbnail_url
          });
          console.log(`Inserted ${channelId} with ${subCount}`);
        }
      }
    } catch (e) {
      console.error(`Failed ${channelId}`, e.message);
    }
  }
}

run();
