import fs from 'fs';
import path from 'path';

async function run() {
  const logPath = "C:\\Users\\91989\\.gemini\\antigravity\\brain\\14a4c8f7-485d-4e62-91c7-8555601b1080\\.system_generated\\logs\\transcript_full.jsonl";
  const content = fs.readFileSync(logPath, 'utf-8');
  
  // Find the last user message
  const lines = content.trim().split('\n');
  let lastUserMessage = "";
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(lines[i]);
      if (parsed.type === "USER_INPUT" && parsed.source === "USER_EXPLICIT") {
        lastUserMessage = parsed.content;
        break;
      }
    } catch(e) {}
  }
  
  if (!lastUserMessage) {
    console.error("No user message found.");
    return;
  }
  
  // Extract all strings that start with PL and are followed by alphanumeric/dashes (YouTube playlist IDs)
  // Usually 34 chars long, sometimes 16 or 18.
  const regex = /PL[A-Za-z0-9_-]+/g;
  const matches = lastUserMessage.match(regex) || [];
  const uniquePlaylists = Array.from(new Set(matches));
  
  console.log(`Found ${uniquePlaylists.length} unique playlists.`);
  
  // Write to a file so we can process them
  fs.writeFileSync("scripts/custom_playlists.json", JSON.stringify(uniquePlaylists, null, 2));
  console.log("Written to scripts/custom_playlists.json");
}

run();
