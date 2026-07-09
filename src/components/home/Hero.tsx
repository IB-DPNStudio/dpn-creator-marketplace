import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background py-10 md:py-16">
      {/* Removed unapproved improvised grid background */}
      <div className="container relative mx-auto px-4 text-center">
        <div className="mx-auto max-w-4xl space-y-6 md:space-y-8">
          
          <div className="flex flex-col items-center justify-center mb-6">
            <h1 className="font-heading font-black text-2xl md:text-4xl tracking-tight uppercase text-foreground">
              INNOVATING TO IMPACT
            </h1>
            <div className="h-2 md:h-3 bg-foreground w-full max-w-[250px] md:max-w-[300px] my-3"></div>
            <img src="/dentsu-logo-new.png" alt="dentsu" className="h-6 md:h-8 w-auto dark:invert" />
          </div>

          <h2 className="font-heading text-2xl md:text-4xl font-bold tracking-tight">
            Audience <span className="text-dentsu">=</span> Revenue
          </h2>
          
          <p className="text-base md:text-xl text-muted-foreground leading-relaxed px-2">
            A curated marketplace connecting India's leading podcasts with advertiser demand through dentsu's managed ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 md:pt-6">
            <Button size="lg" className="w-full sm:w-auto bg-dentsu hover:bg-dentsu/90 text-white font-semibold h-10 md:h-12 px-8" asChild>
              <Link href="/creators/apply">Join the Creator Network</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-10 md:h-12 px-8 border-foreground hover:bg-muted" asChild>
              <Link href="/agencies/apply">Request Agency Access</Link>
            </Button>
          </div>
          
          <div className="pt-4 flex justify-center">
            <a href="#top-20" className="text-sm md:text-base text-dentsu hover:text-dentsu/80 font-bold transition-colors flex items-center">
              Jump to Top 20 Rankings 
              <svg className="ml-1 w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
