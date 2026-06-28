import * as cheerio from 'cheerio';
import { adminSeedPodcast } from '../app/actions/admin';
import 'dotenv/config'; // Make sure to load env vars if running standalone

async function fetchRephonicTopPodcasts() {
  console.log("Fetching top Indian podcasts from Rephonic...");
  try {
    const res = await fetch("https://rephonic.com/charts/apple/in/all");
    if (!res.ok) {
      throw new Error(`Failed to fetch Rephonic charts: ${res.statusText}`);
    }
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const podcastNames: string[] = [];
    
    // Selectors might need updates if Rephonic changes their DOM
    $('h3').each((i, el) => {
      const name = $(el).text().trim();
      if (name && !podcastNames.includes(name)) {
        podcastNames.push(name);
      }
    });
    
    console.log(`Found ${podcastNames.length} podcast names.`);
    
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("Missing YOUTUBE_API_KEY in environment variables.");
    }
    
    // Seed them by searching YouTube for playlists
    for (const name of podcastNames.slice(0, 10)) { // Limit to 10 for safety/rate limits
      console.log(`\nSearching YouTube for: ${name}`);
      const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&q=${encodeURIComponent(name + ' podcast')}&maxResults=1&key=${apiKey}`);
      
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.items && searchData.items.length > 0) {
          const playlistId = searchData.items[0].id.playlistId;
          const url = `https://www.youtube.com/playlist?list=${playlistId}`;
          console.log(`Found Playlist: ${url}`);
          
          try {
            const seedRes = await adminSeedPodcast(url);
            if (seedRes.success) {
              console.log(`✅ Successfully seeded: ${seedRes.data?.showName} (Score: ${seedRes.data?.dpnScore})`);
            } else {
              console.log(`❌ Failed to seed ${url}: ${seedRes.error}`);
            }
          } catch (e: any) {
            console.log(`❌ Error seeding ${url}: ${e.message}`);
          }
        } else {
          console.log(`No YouTube playlist found for ${name}`);
        }
      } else {
        console.log(`YouTube Search API failed: ${searchRes.statusText}`);
      }
      
      // Wait to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log("\nFinished processing Rephonic podcasts.");
    
  } catch (error) {
    console.error("Error fetching from Rephonic:", error);
  }
}

fetchRephonicTopPodcasts();
