import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Shield, ChevronRight } from "lucide-react";
import { switchUserCategory } from "@/app/actions/users";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const roleLabels: Record<string, string> = {
    "creator_manager": "General User",
    "creator": "Creator",
    "agency_user": "Agency",
    "super_admin": "Admin",
    "dpn_sales": "Sales"
  };

  const currentRoleLabel = profile?.role ? roleLabels[profile.role] || profile.role : "Unknown";

  const handleSwitchToGeneral = async () => {
    "use server";
    await switchUserCategory('general');
    redirect('/dashboard/settings');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and preferences.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-dentsu" />
          Account Profile
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 border-b border-border pb-4">
            <div className="text-muted-foreground">Email</div>
            <div className="col-span-2 font-medium">{user.email}</div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-b border-border pb-4">
            <div className="text-muted-foreground">Name</div>
            <div className="col-span-2 font-medium">{profile?.full_name || 'Not provided'}</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-muted-foreground">Current Role</div>
            <div className="col-span-2 font-bold text-dentsu">{currentRoleLabel}</div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-dentsu" />
          Switch Account Category
        </h2>
        <p className="text-muted-foreground mb-6">
          You are currently registered as a <strong>{currentRoleLabel}</strong>. You can only have one active role at a time. Switching roles will permanently delete specific features/data (like EOIs or Podcasts) associated with your old role.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile?.role !== "creator" && (
            <Link href="/creators/apply" className="block group">
              <div className="border border-border rounded-lg p-4 hover:border-dentsu hover:bg-muted/50 transition-all flex items-center justify-between h-full">
                <div>
                  <h3 className="font-bold">Switch to Creator</h3>
                  <p className="text-sm text-muted-foreground mt-1">For podcasters and content creators</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-dentsu group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          )}

          {profile?.role !== "agency_user" && (
            <Link href="/agencies/apply" className="block group">
              <div className="border border-border rounded-lg p-4 hover:border-dentsu hover:bg-muted/50 transition-all flex items-center justify-between h-full">
                <div>
                  <h3 className="font-bold">Switch to Agency</h3>
                  <p className="text-sm text-muted-foreground mt-1">For media buyers and agencies</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-dentsu group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          )}

          {profile?.role !== "creator_manager" && (
            <form action={handleSwitchToGeneral} className="block group cursor-pointer w-full">
              <button type="submit" className="w-full text-left border border-border rounded-lg p-4 hover:border-dentsu hover:bg-muted/50 transition-all flex items-center justify-between h-full">
                <div>
                  <h3 className="font-bold">Switch to General User</h3>
                  <p className="text-sm text-muted-foreground mt-1">For regular viewers of the ranker</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-dentsu group-hover:translate-x-1 transition-all" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
