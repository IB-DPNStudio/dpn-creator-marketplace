import { createClient, createAdminClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

export default async function EOIsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Use adminClient to reliably fetch profile regardless of RLS
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAgency = profile?.role === "agency_user";
  const isAdmin = profile?.role === "dpn_sales" || profile?.role === "super_admin";

  if (!isAgency && !isAdmin) {
    redirect("/dashboard");
  }

  let eois: any[] = [];

  if (isAdmin) {
    const { data } = await adminClient
      .from("eois")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) eois = data;
  } else if (isAgency) {
    // Only attempt to fetch agency if the user is an agency user
    const { data: agency } = await supabase
      .from("agencies")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle(); // Use maybeSingle to prevent PGRST116 errors

    if (agency) {
      const { data } = await supabase
        .from("eois")
        .select("*")
        .eq("agency_id", agency.id)
        .order("created_at", { ascending: false });
      if (data) eois = data;
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {resolvedSearchParams.success && (
        <div className="bg-spotify/10 border border-spotify text-spotify px-6 py-4 rounded-xl font-medium">
          Expression of Interest submitted successfully! The DPN team will review it shortly.
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading">Campaigns (EOIs)</h1>
          <p className="text-muted-foreground mt-2">Manage your Expressions of Interest and active campaigns.</p>
        </div>
        <Button className="bg-dentsu hover:bg-dentsu/90 text-white" asChild>
          <Link href="/dashboard/eois/new">
            <Plus className="w-4 h-4 mr-2" />
            New Campaign EOI
          </Link>
        </Button>
      </div>

      {eois.length === 0 ? (
        <div className="text-center py-24 bg-card border border-border rounded-xl">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold mb-2">No EOIs found</h3>
          <p className="text-muted-foreground mb-6">You haven't submitted any campaign requests yet.</p>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Browse Catalogue</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-sm text-muted-foreground">
                <th className="p-4 font-medium">Campaign Name</th>
                <th className="p-4 font-medium">Brand</th>
                <th className="p-4 font-medium">Date Submitted</th>
                <th className="p-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {eois.map((eoi) => (
                <tr key={eoi.id} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="p-4 font-bold">{eoi.campaign_name}</td>
                  <td className="p-4 text-muted-foreground">{eoi.brand}</td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(eoi.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <span className="bg-secondary px-3 py-1 rounded-full text-xs font-medium capitalize">
                      {eoi.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
