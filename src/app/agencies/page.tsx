import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart3, Search, ShieldCheck } from "lucide-react";

export default function AgenciesPage() {
  const features = [
    {
      icon: <ShieldCheck className="w-10 h-10 text-dentsu" />,
      title: "Curated & Brand Safe",
      description: "Access a hand-picked catalogue of premium Indian podcasts. Every creator is vetted by dentsu for quality and brand safety. (In 3 easy steps, select from a list of podcasts by podcasters, and build a podcast 1st plan. All creators are verified as per dentsu standards, brand friendliness and safety - iAB compliant)"
    },
    {
      icon: <BarChart3 className="w-10 h-10 text-dentsu" />,
      title: "Data-Driven Discovery",
      description: "Filter by reach, engagement, genre, and audience demographics. Use our proprietary DPN Score to identify rising podcasters, consistent performers, and legends all in one frame."
    },
    {
      icon: <Search className="w-10 h-10 text-dentsu" />,
      title: "Seamless Campaign EOIs",
      description: "Build custom media plans and submit Expressions of Interest directly through the platform. Our team handles the rest."
    }
  ];

  return (
    <div className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-20 space-y-6">
          <h1 className="font-heading text-4xl md:text-6xl font-bold">
            The smartest way to buy <span className="text-dentsu">podcast media</span>.
          </h1>
          <p className="text-2xl font-semibold text-foreground/80 mb-2">
            A trusted destination to place your brands on podcasts.
          </p>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            A private marketplace for approved agencies and enterprise brands to discover, evaluate, and book top podcast inventory.
          </p>
          <div className="pt-4">
            <Button size="lg" className="bg-dentsu hover:bg-dentsu/90 text-white font-semibold h-14 px-8" asChild>
              <Link href="/agencies/apply">Apply for Agency Access</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="bg-card border border-border p-8 rounded-xl space-y-4">
               <div className="bg-background w-16 h-16 rounded-lg flex items-center justify-center border border-border">
                {feature.icon}
              </div>
              <h3 className="font-bold text-xl font-heading">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-dentsu/5 border border-dentsu/20 p-10 md:p-14 rounded-2xl text-center space-y-6">
          <h2 className="font-heading text-3xl font-bold">Brands - Build your own Podcast</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Looking to create an original branded podcast? Our award-winning production network provides end-to-end strategy, production, and distribution tailored precisely for your brand&apos;s voice.
          </p>
          <div className="pt-4">
            <Button size="lg" variant="outline" className="border-dentsu text-dentsu hover:bg-dentsu hover:text-white font-semibold" asChild>
              <Link href="mailto:studio@ideabrews.com">Contact Production Team</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
