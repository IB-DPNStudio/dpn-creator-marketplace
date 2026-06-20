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

  // Fetch all profiles
  const { data: profiles, error } = await adminClient
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching profiles:", error);
  }


  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold font-heading text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-2">Invite new agency partners and manage network access roles.</p>
      </div>

      <UsersTable 
        profiles={profiles || []} 
        currentUserRole={currentUserRole} 
      />
    </div>
  );
}
