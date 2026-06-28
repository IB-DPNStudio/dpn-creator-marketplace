import { createClient } from "@/utils/supabase/server";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CatalogueFilters } from "@/components/dashboard/CatalogueFilters";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string; lang?: string }>;
}) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;

  // Fetch active podcasts to extract dynamic genres and languages
  const { data: allFiltersData } = await supabase
    .from("playlist_podcasts")
    .select("genre, primary_language")
    .in("status", ["seeded", "verified", "approved_partner", "featured_partner"]);

  const genres = Array.from(
    new Set((allFiltersData || []).map((p) => p.genre).filter(Boolean))
  ).sort() as string[];

  const languages = Array.from(
    new Set((allFiltersData || []).map((p) => p.primary_language).filter(Boolean))
  ).sort() as string[];

  // Dynamically build filtering query to run on Supabase (optimizing columns fetched)
  let query = supabase
    .from("playlist_podcasts")
    .select("id, show_name, genre, primary_language, average_views_per_episode, final_score, thumbnail_url, status, description")
    .in("status", ["seeded", "verified", "approved_partner", "featured_partner"])
    .eq("is_included", true);

  if (resolvedSearchParams.q) {
    const q = resolvedSearchParams.q;
    query = query.or(`show_name.ilike.%${q}%,genre.ilike.%${q}%,description.ilike.%${q}%`);
  }
  
  if (resolvedSearchParams.genre && resolvedSearchParams.genre !== "All") {
    query = query.eq("genre", resolvedSearchParams.genre);
  }

  if (resolvedSearchParams.lang && resolvedSearchParams.lang !== "All") {
    query = query.eq("primary_language", resolvedSearchParams.lang);
  }

  const { data: podcasts } = await query.order("final_score", { ascending: false });
  const displayPodcasts = podcasts || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">Playlist Catalogue</h1>
        <p className="text-muted-foreground mt-2">Discover and filter premium playlist inventory.</p>
      </div>

      <CatalogueFilters genres={genres} languages={languages} />

      {displayPodcasts.length === 0 ? (
        <div className="text-center py-24 bg-card border border-border rounded-xl">
          <h3 className="text-lg font-bold mb-2">No playlists available</h3>
          <p className="text-muted-foreground">No matches found for your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayPodcasts.map((podcast) => (
            <Link key={podcast.id} href={`/dashboard/podcasts/${podcast.id}`}>
              <div className="group bg-card border border-border rounded-xl overflow-hidden hover:border-dentsu transition-colors h-full flex flex-col">
                <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
                  {podcast.thumbnail_url ? (
                    <>
                      <Image 
                        src={podcast.thumbnail_url} 
                        alt={podcast.show_name} 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover blur-[4px] opacity-40 scale-105 transition-transform duration-300 group-hover:scale-110"
                        priority={false}
                      />
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-background shadow-lg z-10 group-hover:scale-105 transition-transform duration-300">
                        <Image 
                          src={podcast.thumbnail_url} 
                          alt={podcast.show_name} 
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground/50 font-medium z-10">No Art</span>
                  )}
                  {podcast.status === 'featured_partner' && (
                    <div className="absolute top-3 right-3 bg-dentsu text-white text-xs font-bold px-2 py-1 rounded z-20">
                      Featured
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg leading-tight group-hover:text-dentsu transition-colors line-clamp-2">
                      {podcast.show_name}
                    </h3>
                  </div>
                  
                  <div className="mt-auto space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-secondary px-2 py-1 rounded text-xs font-medium">{podcast.genre}</span>
                      <span className="bg-secondary px-2 py-1 rounded text-xs font-medium">{podcast.primary_language}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">
                          {podcast.average_views_per_episode ? (podcast.average_views_per_episode >= 1000000 ? (podcast.average_views_per_episode / 1000000).toFixed(1) + 'M' : (podcast.average_views_per_episode / 1000).toFixed(1) + 'k') : 'N/A'}
                        </span> avg views
                      </div>
                      <div className="flex items-center space-x-1 text-spotify font-mono font-bold text-sm">
                        <TrendingUp className="w-4 h-4" />
                        <span>{podcast.final_score?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
