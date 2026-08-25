import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

async function generateTable() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data, error } = await db
    .from('playlist_podcasts')
    .select('playlist_id, show_name, genre, primary_language')
    .or('genre.ilike.%general%,primary_language.ilike.%unknown%')
    .eq('is_included', true)
    .order('final_score', { ascending: false });
    
  if (error) {
    console.error('Error fetching data:', error);
    return;
  }
  
  let md = '# Playlists Requiring Categorization\n\n';
  md += 'The following playlists are currently marked as **General** (Genre) or **Unknown** (Language).\n\n';
  md += '| Show Name | Current Genre | Current Language | Playlist ID |\n';
  md += '|---|---|---|---|\n';
  
  for (const p of data || []) {
    const showName = p.show_name?.replace(/\|/g, '-') || 'Unknown';
    md += `| ${showName} | ${p.genre} | ${p.primary_language} | \`${p.playlist_id}\` |\n`;
  }
  
  fs.writeFileSync('C:/Users/91989/.gemini/antigravity/brain/14a4c8f7-485d-4e62-91c7-8555601b1080/uncategorized_playlists.md', md);
  console.log('Artifact created with ' + (data?.length || 0) + ' items.');
}

generateTable();
