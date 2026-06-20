const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://mxismplknklokkziivpp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aXNtcGxrbmtsb2tremlpdnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg2NjQxNCwiZXhwIjoyMDk3NDQyNDE0fQ.RwfWK0JpdAJhUhBxUQ-37kH1etuVA8PtumV1lAX95ow',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data: authUsers, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(error);
    return;
  }
  
  const user = authUsers.users.find(u => u.email === 'studio@ideabrews.com');
  if (user) {
    console.log("Auth user found:", user.id);
    // insert into profiles if missing
    const { error: insertErr } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      role: 'super_admin',
      full_name: 'Studio Admin'
    });
    if (insertErr) {
        console.error("Insert error:", insertErr);
    } else {
        console.log("Profile created and set to super_admin");
    }
  } else {
    console.log("Auth user not found!");
  }
}

main();
