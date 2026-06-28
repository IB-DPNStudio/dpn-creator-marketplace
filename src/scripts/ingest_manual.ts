import { addOrUpdatePlaylistRank } from '../app/actions/labs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function ingestManual() {
  const urls = [
    "https://www.youtube.com/playlist?list=PLFBfr_L53wOAXg0owed8Kf2WJmbTgxB56",
    "https://www.youtube.com/playlist?list=PL9uK6jbdzfVc7wNQmyixrMpZNPMHMgXIc",
    "https://www.youtube.com/playlist?list=PL9uK6jbdzfVfqaEhdY3wQBpcQndKNSUgj",
    "https://www.youtube.com/playlist?list=PL9uK6jbdzfVeV-l6Rd5JwczjDt7_2Ct5R",
    "https://www.youtube.com/playlist?list=PLpSN4vP31-Ku10h9c8jrTjSRFbFdQ8TR6",
    "https://www.youtube.com/playlist?list=PLE0Jo6NF_JYO5-phess8GKafKMtPv3tfZ",
    "https://www.youtube.com/playlist?list=PLa6DgTttATAc0hftp0aZtUvCgVSKO8hbx",
    "https://www.youtube.com/playlist?list=PL9uK6jbdzfVfBzNfitRmYaCXCyq9TaY8q",
    "https://www.youtube.com/playlist?list=PLW8nwheTMPtHTXNBM9ajmkZgCz8xYogE2"
  ];

  const adminDbClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  for (const url of urls) {
    console.log(`\nIngesting: ${url}`);
    try {
      const seedRes = await addOrUpdatePlaylistRank({ playlistUrlOrId: url, isIncluded: true });
      if (seedRes.success) {
        // Mark as seeded
        const playlistIdMatch = url.match(/[?&]list=([^&]+)/);
        const playlistId = playlistIdMatch ? playlistIdMatch[1] : url;
        await adminDbClient.from("playlist_podcasts").update({ status: 'seeded' }).eq("playlist_id", playlistId);
        
        console.log(`✅ Successfully seeded: ${playlistId}`);
      } else {
        console.log(`❌ Failed: ${seedRes.error}`);
      }
    } catch (e: any) {
      console.log(`❌ Error: ${e.message}`);
    }
  }
}

ingestManual();
