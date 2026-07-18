import { Hero } from "@/components/home/Hero";
import { IndustryStats } from "@/components/home/IndustryStats";
import { HowItWorks } from "@/components/home/HowItWorks";
import LabsClient from "@/app/labs/LabsClient";
import { getLabsPlaylists } from "@/app/actions/labs";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const revalidate = 3600;

export default async function Home() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const isAdmin = session?.user?.email === 'studio@ideabrews.com';
  const isSignedIn = !!session?.user;
  
  // Fetch top 20 playlists instead of podcasts
  const allPlaylists = await getLabsPlaylists(["seeded", "verified", "approved_partner", "featured_partner"]);
  const topPlaylists = allPlaylists.slice(0, 20);

  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <IndustryStats />
      
      {/* Top 20 Rankings Section */}
      <section id="top-20" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="font-heading text-2xl md:text-5xl font-bold mb-3 md:mb-4">
              India's Top 20 Podcasts
            </h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Get a glimpse of the most influential voices currently dominating the network.
            </p>
          </div>
          
          <LabsClient initialPlaylists={topPlaylists} isAdmin={isAdmin} isLabs={false} isSignedIn={isSignedIn} />
          
          <div className="mt-12 text-center">
            <Link href="/rankings">
              <Button size="lg" className="bg-dentsu hover:bg-dentsu/90 text-white font-semibold">
                View Full Power Ranker <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <HowItWorks />
    </div>
  );
}
