const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://mxismplknklokkziivpp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aXNtcGxrbmtsb2tremlpdnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg2NjQxNCwiZXhwIjoyMDk3NDQyNDE0fQ.RwfWK0JpdAJhUhBxUQ-37kH1etuVA8PtumV1lAX95ow'
);

async function main() {
  const { data: users, error: selectErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'studio@ideabrews.com');
    
  if (selectErr) {
    console.error("Error fetching user:", selectErr);
    return;
  }
  
  if (users.length === 0) {
    console.log("User studio@ideabrews.com not found in profiles table.");
    return;
  }
  
  console.log("Current profile:", users[0]);
  
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ role: 'super_admin' })
    .eq('email', 'studio@ideabrews.com');
    
  if (updateErr) {
    console.error("Error updating user:", updateErr);
  } else {
    console.log("Successfully updated studio@ideabrews.com to super_admin");
  }
}

main();
