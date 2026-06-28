import { createClient, createAdminClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Star, StarOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { togglePodcastFeatured, deletePodcast, refreshSevenDayViews } from "@/app/actions/admin";
import { DeletePodcastButton } from "@/components/admin/DeletePodcastButton";
import { PodcastEmailActions } from "@/components/admin/PodcastEmailActions";
import { RefreshSevenDayViewsButton } from "@/components/admin/RefreshSevenDayViewsButton";

export default async function AdminPodcastsPage() {
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

  const isSuperUser = user.email === 'studio@ideabrews.com';

  // Fetch approved/featured playlists using adminClient
  const { data: podcasts } = await adminClient
    .from("playlist_podcasts")
    .select("*, profiles(email)")
    .in("status", ["seeded", "verified", "approved_partner", "featured_partner"])
    .order("final_score", { ascending: false });

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-heading">Manage Playlists</h1>
          <p className="text-muted-foreground mt-2">Manage all active playlists on the platform and set Featured status.</p>
        </div>
        <RefreshSevenDayViewsButton onRefresh={async () => {
          "use server";
          await refreshSevenDayViews();
        }} />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="p-4 font-bold w-16">Rank</th>
              <th className="p-4 font-bold">Playlist Name</th>
              <th className="p-4 font-bold w-48">Creator Email</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {podcasts?.map((podcast, index) => {
              const isFeatured = podcast.status === 'featured_partner';
              const handle = podcast.playlist_id;
              
              return (
                <tr key={podcast.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-bold text-muted-foreground align-top pt-5">
                    #{index + 1}
                  </td>
                  <td className="p-4 align-top pt-5">
                    <div className="font-bold text-foreground">
                      {podcast.show_name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{podcast.genre} • {podcast.primary_language || 'Unknown'}</div>
                  </td>
                  <td className="p-4 align-top pt-4">
                    <PodcastEmailActions 
                      podcastId={podcast.id}
                      currentEmail={podcast.profiles?.email || podcast.contact_email}
                      isClaimed={!!podcast.owner_id}
                      emailsSentCount={podcast.claim_emails_sent || 0}
                    />
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isFeatured ? 'bg-dentsu text-white' : 
                      podcast.status === 'approved_partner' ? 'bg-green-500/10 text-green-600' :
                      podcast.status === 'verified' ? 'bg-blue-500/10 text-blue-600' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isFeatured ? 'Featured' : 
                       podcast.status === 'approved_partner' ? 'Approved Partner' : 
                       podcast.status === 'verified' ? 'Verified' : 'Seeded'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <form action={async () => {
                        "use server";
                        await togglePodcastFeatured(podcast.id, isFeatured);
                      }}>
                        <Button 
                          type="submit" 
                          variant={isFeatured ? "outline" : "default"}
                          size="sm"
                          className={!isFeatured ? "bg-dentsu hover:bg-dentsu/90 text-white" : ""}
                        >
                          {isFeatured ? (
                            <><StarOff className="w-4 h-4 mr-2" /> Remove Feature</>
                          ) : (
                            <><Star className="w-4 h-4 mr-2" /> Feature Show</>
                          )}
                        </Button>
                      </form>
                      {isSuperUser && (
                        <DeletePodcastButton onDelete={async () => {
                          "use server";
                          await deletePodcast(podcast.id);
                        }} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!podcasts || podcasts.length === 0) && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No approved playlists found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
