import { Hero } from "@/components/home/Hero";
import { IndustryStats } from "@/components/home/IndustryStats";
import { HowItWorks } from "@/components/home/HowItWorks";
import { RankingsTable } from "@/components/rankings/RankingsTable";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const revalidate = 3600;

export default async function Home() {
  const supabase = await createClient();
  
  const { data: podcasts } = await supabase
    .from("podcasts")
    .select("*")
    .in("status", ["seeded", "verified", "approved_partner", "featured_partner"])
    .order("dpn_score", { ascending: false })
    .limit(20);

  const topPodcasts = podcasts || [];

  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <IndustryStats />
      
      {/* Top 20 Rankings Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="font-heading text-2xl md:text-5xl font-bold mb-3 md:mb-4">
              Top 20 Creators on DPN
            </h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Get a glimpse of the most influential voices currently dominating the network.
            </p>
          </div>
          
          <RankingsTable podcasts={topPodcasts} />
          
          <div className="mt-12 text-center">
            <Button asChild size="lg" className="bg-dentsu hover:bg-dentsu/90 text-white font-semibold">
              <Link href="/rankings">
                View Full Power Ranker <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <HowItWorks />
    </div>
  );
}
