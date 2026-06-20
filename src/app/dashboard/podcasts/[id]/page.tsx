import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, TrendingUp, Users, PlayCircle, BarChart } from "lucide-react";

export default async function PodcastDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();
  
  const { data: podcast } = await supabase
    .from("podcasts")
    .select("*")
    .eq("id", resolvedParams.id)
    .single();

  if (!podcast) {
    notFound();
  }

  const inventory = podcast.inventory_availability || {};
  const activeInventory = Object.keys(inventory).filter((key) => inventory[key]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground">
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalogue
          </Link>
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 aspect-square bg-muted rounded-xl flex items-center justify-center relative overflow-hidden">
          {podcast.cover_art_url ? (
            <img src={podcast.cover_art_url} alt={podcast.show_name} className="object-cover w-full h-full" />
          ) : (
            <span className="text-muted-foreground font-medium">Cover Art</span>
          )}
        </div>
        
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="bg-secondary px-3 py-1 rounded-md text-sm font-medium">{podcast.genre}</span>
              {podcast.status === 'featured_partner' && (
                <span className="bg-dentsu text-white px-3 py-1 rounded-md text-sm font-bold">Featured Partner</span>
              )}
            </div>
            <h1 className="font-heading text-4xl font-bold mb-2">{podcast.show_name}</h1>
            <p className="text-xl text-muted-foreground">Hosted by {podcast.host_name}</p>
          </div>

          <p className="text-base leading-relaxed">{podcast.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-border">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground flex items-center"><TrendingUp className="w-4 h-4 mr-1"/> DPN Score</div>
              <div className="text-2xl font-bold font-mono text-spotify">{podcast.dpn_score || '0.0'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground flex items-center"><Users className="w-4 h-4 mr-1"/> Subscribers</div>
              <div className="text-2xl font-bold font-mono">{podcast.subscriber_count ? (podcast.subscriber_count >= 1000000 ? (podcast.subscriber_count / 1000000).toFixed(1) + 'M' : (podcast.subscriber_count / 1000).toFixed(1) + 'k') : 'N/A'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground flex items-center"><PlayCircle className="w-4 h-4 mr-1"/> Episodes</div>
              <div className="text-2xl font-bold font-mono">{podcast.episode_count || 0}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground flex items-center"><BarChart className="w-4 h-4 mr-1"/> Est. Reach</div>
              <div className="text-2xl font-bold font-mono">{podcast.estimated_reach ? (podcast.estimated_reach >= 1000000 ? (podcast.estimated_reach / 1000000).toFixed(1) + 'M' : (podcast.estimated_reach / 1000).toFixed(1) + 'k') : 'N/A'}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" className="bg-dentsu hover:bg-dentsu/90 text-white font-semibold flex-1" asChild>
              <Link href={`/dashboard/eois/new?podcast_id=${podcast.id}`}>
                Draft Campaign EOI
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="flex-1" asChild>
              <a href={podcast.youtube_url || podcast.spotify_url || '#'} target="_blank" rel="noopener noreferrer">
                View Channel
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-border p-8 rounded-2xl">
          <h3 className="font-heading text-xl font-bold mb-6">Available Ad Inventory</h3>
          {activeInventory.length > 0 ? (
            <ul className="space-y-4">
              {activeInventory.map(inv => (
                <li key={inv} className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-spotify mr-3" />
                  <span className="capitalize">{inv.replace(/_/g, ' ')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Inventory details pending.</p>
          )}
        </div>
        
        <div className="bg-card border border-border p-8 rounded-2xl">
          <h3 className="font-heading text-xl font-bold mb-6">Audience Profile</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Primary Language</span>
              <span className="font-medium">{podcast.primary_language || 'N/A'}</span>
            </li>
            <li className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Geography</span>
              <span className="font-medium">{podcast.country || 'India'}</span>
            </li>
            <li className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium">{podcast.network || 'Independent'}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
