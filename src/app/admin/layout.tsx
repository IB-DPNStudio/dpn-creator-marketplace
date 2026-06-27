import { createClient, createAdminClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, FileText, Activity, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileAdminNav } from "@/components/admin/MobileAdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== 'super_admin' && profile?.role !== 'dpn_sales') {
    redirect("/dashboard");
  }


  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Mobile Navigation */}
      <MobileAdminNav />

      {/* Admin Sidebar (Desktop) */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border bg-dentsu text-white">
          <span className="font-heading font-bold text-lg tracking-tight">
            DPN Admin
          </span>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2">
          <Link href="/admin" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary transition-colors">
            <LayoutDashboard className="w-5 h-5 mr-3 text-muted-foreground" />
            Overview
          </Link>
          <Link href="/admin/approvals" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary transition-colors">
            <Users className="w-5 h-5 mr-3 text-muted-foreground" />
            Approvals
          </Link>
          <Link href="/admin/users" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary transition-colors">
            <Users className="w-5 h-5 mr-3 text-muted-foreground" />
            User Management
          </Link>
          <Link href="/admin/entities/new" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary transition-colors">
            <FileText className="w-5 h-5 mr-3 text-muted-foreground" />
            White Glove Onboarding
          </Link>
          <Link href="/admin/podcasts" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary transition-colors">
            <Activity className="w-5 h-5 mr-3 text-muted-foreground" />
            Manage Podcasts
          </Link>
        </nav>
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start text-destructive" asChild>
            <Link href="/dashboard">
              <LogOut className="w-5 h-5 mr-3" />
              Exit Admin
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
