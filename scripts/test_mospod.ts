import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelHandle = '@MoS-Pod';
  const endpoint = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,topicDetails,contentDetails&forHandle=${encodeURIComponent(channelHandle)}&key=${apiKey}`;
  
  const res = await fetch(endpoint);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

run();
