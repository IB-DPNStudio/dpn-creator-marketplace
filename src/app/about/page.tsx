export default function AboutPage() {
  return (
    <div className="py-24 bg-background min-h-[80vh]">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="font-heading text-4xl md:text-6xl font-bold mb-8">About dentsu podcast network</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-xl text-muted-foreground leading-relaxed">
            The dentsu podcast network (DPN) is India's first fully vetted, brand-safe marketplace connecting top-tier podcast creators with enterprise advertiser demand.
          </p>
          
          <div className="space-y-12 mt-12">
            <section>
              <h2 className="font-heading text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                To empower India's leading podcast creators by connecting them with premium enterprise demand. 
                We believe that engaged audiences deserve quality sponsorships, and advertisers deserve transparent, 
                high-performing inventory.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold mb-4">The dentsu Advantage</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                As part of the global dentsu network, DPN acts as a trusted intermediary between creators and the world's largest brands. 
                This is not a self-serve marketplace filled with noise. This is a curated, managed ecosystem where quality wins.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Vetted, brand-safe creators.</li>
                <li>Exclusive access to premium agency budgets.</li>
                <li>Data-driven rankings and pricing insights.</li>
                <li>Full-service campaign management.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
