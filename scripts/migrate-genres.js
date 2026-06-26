const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching all podcasts...');
  const { data: podcasts, error } = await supabase.from('podcasts').select('id, genre, primary_language');
  
  if (error) {
    console.error('Error fetching podcasts:', error);
    process.exit(1);
  }

  console.log(`Found ${podcasts?.length || 0} podcasts.`);

  for (const podcast of podcasts || []) {
    let newGenre = podcast.genre;
    let newLang = podcast.primary_language;
    let needsUpdate = false;

    // Fix languages (Hinglish deduplication)
    if (newLang) {
      if (newLang.toLowerCase().trim() === 'hinglish') {
        if (newLang !== 'Hinglish') {
          newLang = 'Hinglish';
          needsUpdate = true;
        }
      }
    }

    // Fix genres
    if (newGenre) {
      const gLower = newGenre.toLowerCase().trim();
      if (gLower === 'health' || gLower === 'health & wellness') {
        newGenre = 'Health & Fitness';
      } else if (gLower === 'education') {
        newGenre = 'Education & Learning';
      } else if (gLower === 'current affairs' || gLower === 'news & politics') {
        newGenre = 'News & Current Affairs';
      } else if (gLower === 'humour' || gLower === 'entertainment') {
        newGenre = 'Comedy & Entertainment';
      }

      if (newGenre !== podcast.genre) {
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      console.log(`Updating podcast ${podcast.id}: Genre [${podcast.genre}] -> [${newGenre}], Lang [${podcast.primary_language}] -> [${newLang}]`);
      const { error: updateError } = await supabase
        .from('podcasts')
        .update({ genre: newGenre, primary_language: newLang })
        .eq('id', podcast.id);
        
      if (updateError) {
        console.error(`Failed to update ${podcast.id}:`, updateError);
      }
    }
  }

  console.log('Migration complete.');
}

main();
