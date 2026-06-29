import { createClient, createAdminClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { UsersTable } from "@/components/admin/UsersTable";

export default async function UsersAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  // Get current user role
  const { data: currentUserProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const currentUserRole = currentUserProfile?.role || 'agency_user';

  if (currentUserRole !== 'super_admin' && currentUserRole !== 'dpn_sales') {
    redirect("/admin");
  }

  // Fetch all auth users to ensure we see users even if they haven't completed profile setup
  const { data: authUsersResponse, error: authError } = await adminClient.auth.admin.listUsers();
  
  // Fetch all profiles to get roles and names
  const { data: profilesData, error: profileError } = await adminClient
    .from("profiles")
    .select("id, email, full_name, role, created_at");

  if (authError) console.error("Error fetching auth users:", authError);
  if (profileError) console.error("Error fetching profiles:", profileError);

  const mergedProfiles = (authUsersResponse?.users || []).map(authUser => {
    const profile = profilesData?.find(p => p.id === authUser.id);
    return {
      id: authUser.id,
      email: authUser.email || profile?.email,
      full_name: profile?.full_name || authUser.user_metadata?.full_name || '',
      role: profile?.role || authUser.user_metadata?.role || 'general_user',
      created_at: authUser.created_at
    };
  });

  mergedProfiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());


  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold font-heading text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-2">Invite new agency partners and manage network access roles.</p>
      </div>

      <UsersTable 
        profiles={mergedProfiles} 
        currentUserRole={currentUserRole} 
      />
    </div>
  );
}
