import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CategorySwitcher } from "@/components/dashboard/CategorySwitcher";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/profile");
  }

  // Get user profile bypassing RLS
  const { createAdminClient } = await import('@/utils/supabase/server')
  const adminClient = createAdminClient()
  
  const { data: profile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  let currentProfile = profile;
  if (!currentProfile) {
    // Graceful fallback auto-creation of general profile
    const { data: newProfile, error } = await adminClient
      .from("profiles")
      .upsert({
        id: user.id,
        role: "general_user",
        email: user.email,
        full_name: user.user_metadata.full_name || user.email?.split("@")[0],
      })
      .select()
      .single();
    
    if (newProfile) {
      currentProfile = newProfile;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">My Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal details and adjust your workspace category.
        </p>
      </div>

      <CategorySwitcher 
        currentRole={currentProfile?.role || "general_user"} 
        userEmail={user.email!} 
        currentProfile={currentProfile}
      />
    </div>
  );
}
