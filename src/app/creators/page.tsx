import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function CreatorsPage() {
  const benefits = [
    "Direct access to dentsu's enterprise brand clients.",
    "Comprehensive monetization and premium CPMs.",
    "Weekly rankings to showcase your growth to buyers.",
    "Transparent revenue share and timely payments.",
    "Dedicated Creator Success Manager for top tiers."
  ];

  return (
    <div className="py-24 bg-background min-h-[80vh] flex flex-col justify-center">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h1 className="font-heading text-4xl md:text-6xl font-bold">
              Turn your <span className="text-dentsu">audience</span> into predictable revenue.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Join India's most exclusive podcast network. We connect top creators with enterprise advertisers looking for high-quality, brand-safe inventory.
            </p>
            <div className="pt-4">
              <Button size="lg" className="bg-dentsu hover:bg-dentsu/90 text-white font-semibold h-14 px-8 w-full sm:w-auto" asChild>
                <Link href="/creators/apply">Apply to Join the Network</Link>
              </Button>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-lg">
            <h3 className="font-heading text-2xl font-bold mb-6">Why join DPN?</h3>
            <ul className="space-y-6">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-spotify mr-4 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
