import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';
import { addOrUpdatePlaylistRank } from '../src/app/actions/labs';

async function run() {
  const playlists = JSON.parse(fs.readFileSync('scripts/custom_playlists.json', 'utf-8'));
  console.log(`Starting ingestion of ${playlists.length} playlists...`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < playlists.length; i++) {
    const playlistId = playlists[i];
    console.log(`[${i+1}/${playlists.length}] Processing ${playlistId}...`);
    try {
      const result = await addOrUpdatePlaylistRank({
        playlistUrlOrId: playlistId,
        title: "",
        description: "",
        language: "Hindi", // Default, could be English but user can modify later
        country: "IN",
        genre: "General",
        manualBoost: 0,
        manualPenalty: 0,
        notes: "Auto-ingested from custom list"
      });
      
      if (result.success) {
        successCount++;
        console.log(`  Success: ${playlistId}`);
      } else {
        failCount++;
        console.log(`  Failed: ${playlistId} - ${result.error}`);
      }
    } catch (e: any) {
      failCount++;
      console.log(`  Error: ${playlistId} - ${e.message}`);
    }
    
    // Slight delay to prevent rate limit issues
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\nFinished! Success: ${successCount}, Failed: ${failCount}`);
}

run();
