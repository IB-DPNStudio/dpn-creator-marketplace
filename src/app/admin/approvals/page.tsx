import { createClient, createAdminClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

export default async function AdminApprovalsPage() {
  const adminClient = createAdminClient();
  
  const { data: pendingPodcasts } = await adminClient
    .from("podcasts")
    .select("*")
    .in("status", ["under_review", "verified"]) // including verified since they need to be approved_partner
    .order("created_at", { ascending: false });

  const { data: pendingAgencies } = await adminClient
    .from("agencies")
    .select("*, profiles(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  async function approvePodcast(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const adminClient = createAdminClient();
    await adminClient.from("podcasts").update({ status: 'approved_partner' }).eq("id", id);
    revalidatePath("/admin/approvals");
  }

  async function approveAgency(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const adminClient = createAdminClient();
    await adminClient.from("agencies").update({ status: 'approved' }).eq("id", id);
    revalidatePath("/admin/approvals");
  }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">Approvals</h1>
        <p className="text-muted-foreground mt-2">Manage incoming applications for Creators and Agencies.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Creator Approvals */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-muted/50 p-4 border-b border-border font-bold">
            Pending Creators ({pendingPodcasts?.length || 0})
          </div>
          <div className="divide-y divide-border">
            {!pendingPodcasts || pendingPodcasts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No pending creators.</div>
            ) : (
              pendingPodcasts.map(podcast => (
                <div key={podcast.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-bold">{podcast.show_name}</div>
                    <div className="text-sm text-muted-foreground">{podcast.genre} • {podcast.primary_language}</div>
                  </div>
                  <form action={approvePodcast}>
                    <input type="hidden" name="id" value={podcast.id} />
                    <Button type="submit" size="sm" className="bg-spotify hover:bg-spotify/90 text-white">Approve</Button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Agency Approvals */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-muted/50 p-4 border-b border-border font-bold">
            Pending Agencies ({pendingAgencies?.length || 0})
          </div>
          <div className="divide-y divide-border">
            {!pendingAgencies || pendingAgencies.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No pending agencies.</div>
            ) : (
              pendingAgencies.map(agency => (
                <div key={agency.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-bold">{agency.company_name}</div>
                    <div className="text-sm text-muted-foreground">{agency.profiles?.full_name} • {agency.email}</div>
                  </div>
                  <form action={approveAgency}>
                    <input type="hidden" name="id" value={agency.id} />
                    <Button type="submit" size="sm" className="bg-dentsu hover:bg-dentsu/90 text-white">Approve</Button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
