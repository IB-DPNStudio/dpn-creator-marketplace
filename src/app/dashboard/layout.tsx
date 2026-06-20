import { createClient, createAdminClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Mic2, FileText, Settings, LogOut, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile using admin client to bypass RLS blocks
  const adminClient = createAdminClient();
  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();


  if (error) {
    console.error("DASHBOARD LAYOUT PROFILE ERROR:", error);
  }

  const isAgency = profile?.role === 'agency_user';
  const isAdmin = profile?.role === 'dpn_sales' || profile?.role === 'super_admin';
  console.log("DASHBOARD LAYOUT DEBUG:", { userId: user.id, profileRole: profile?.role, isAdmin });

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="font-heading font-bold text-lg tracking-tight">
            <span className="text-dentsu">DPN</span> Dashboard
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <Link href="/dashboard" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Catalogue
          </Link>
          {(isAgency || isAdmin) && (
            <Link href="/dashboard/eois" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <FileText className="w-5 h-5 mr-3" />
              Campaigns (EOIs)
            </Link>
          )}
          <Link href="/dashboard/profile" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <User className="w-5 h-5 mr-3" />
            My Profile
          </Link>
          {isAdmin && (
            <>
              <Link href="/admin" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <Settings className="w-5 h-5 mr-3" />
                DPN Admin
              </Link>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-border">
          <form action="/auth/signout" method="post">
            <button className="flex w-full items-center px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center justify-end px-8 sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium">{profile?.full_name || user.email}</div>
            <div className="w-8 h-8 rounded-full bg-dentsu text-white flex items-center justify-center font-bold text-xs uppercase">
              {(profile?.full_name || user.email || 'U')[0]}
            </div>
          </div>
        </header>
        <div className="flex-1 p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
