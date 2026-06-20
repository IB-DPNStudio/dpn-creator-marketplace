const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function check() {
  // First find the user by email
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Auth error:", authError);
    return;
  }
  
  const user = users.find(u => u.email === 'studio@ideabrews.com');
  if (!user) {
    console.log("User studio@ideabrews.com not found");
    return;
  }
  console.log("Found user:", user.id);
  
  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (profileError) {
    console.error("Profile error:", profileError);
    // If no profile, maybe create one?
    const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        role: 'super_admin',
        email: 'studio@ideabrews.com'
    });
    if (insertError) {
        console.error("Failed to create profile:", insertError);
    } else {
        console.log("Created profile as super_admin");
    }
    return;
  }
  
  console.log("Current profile:", profile);
  
  if (profile.role !== 'super_admin') {
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', user.id)
      .select()
      .single();
      
    if (updateError) {
      console.error("Update error:", updateError);
    } else {
      console.log("Updated profile:", updated);
    }
  } else {
    console.log("Role is already super_admin!");
  }
}

check();
