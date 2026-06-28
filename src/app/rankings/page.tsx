import { createClient } from "@/utils/supabase/server";
import { NewShowsCarousel } from "@/components/rankings/NewShowsCarousel";
import LabsClient from "@/app/labs/LabsClient";
import { getLabsPlaylists } from "@/app/actions/labs";
import { CalendarDays } from "lucide-react";
import { format, startOfWeek } from "date-fns";

export const dynamic = 'force-dynamic';

export default async function RankingsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const isAdmin = session?.user?.email === 'studio@ideabrews.com';
  
  // Fetch all approved playlists
  const validPlaylists = await getLabsPlaylists(["seeded", "verified", "approved_partner", "featured_partner"]);
  
  // Filter new shows (featured_partner or seeded randomly to mock "new")
  const newShows = validPlaylists.filter(p => p.status === "featured_partner" || (p.average_views_per_episode || 0) > 100000).slice(0, 15);
  
  // Calculate the current week for the "auto-published" feel
  const currentWeekDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "MMM do, yyyy");

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Glamorous Header */}
      <div className="bg-gradient-to-b from-dentsu/10 to-background pt-24 pb-12 border-b border-border/50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <h1 className="font-heading text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-dentsu via-red-500 to-orange-400">
              The DPN Power Ranker
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Discover the most influential voices across the network, automatically updated weekly based on proprietary DPN Engagement Scores.
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-card border border-border rounded-full shadow-sm">
              <CalendarDays className="w-4 h-4 mr-2 text-dentsu" />
              <span className="text-sm font-semibold text-foreground">Week of {currentWeekDate}</span>
            </div>
          </div>
          
          {/* New Shows Carousel */}
          <NewShowsCarousel podcasts={newShows} />
        </div>
      </div>

      {/* Main Rankings Area */}
      <div className="container mx-auto px-4 max-w-7xl mt-12">
        <LabsClient initialPlaylists={validPlaylists} isAdmin={isAdmin} isLabs={false} />
      </div>
    </div>
  );
}
