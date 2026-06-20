import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-32">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      <div className="container relative mx-auto px-4 text-center">
        <div className="mx-auto max-w-3xl space-y-6 md:space-y-8">
          <h1 className="font-heading text-4xl md:text-7xl font-extrabold tracking-tight">
            Audience <span className="text-dentsu">=</span> Revenue
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground leading-relaxed px-2">
            A curated marketplace connecting India's leading podcasts with advertiser demand through Dentsu's managed ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 md:pt-8">
            <Button size="lg" className="w-full sm:w-auto bg-dentsu hover:bg-dentsu/90 text-white font-semibold h-12 px-8" asChild>
              <Link href="/creators/apply">Join the Creator Network</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8" asChild>
              <Link href="/agencies/apply">Request Agency Access</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
