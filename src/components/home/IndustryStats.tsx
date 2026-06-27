export function IndustryStats() {
  const stats = [
    { value: "200M+", label: "Podcast Listeners" },
    { value: "3rd", label: "Largest Podcast Market Globally" },
    { value: "$276M", label: "Podcast Ad Spend" },
    { value: "$587M", label: "Projected Ad Spend" },
    { value: "78%", label: "Host Read Revenue Share" },
  ];

  return (
    <section className="border-y border-border bg-card py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-8 text-center">
          {stats.map((stat, i) => (
            <div key={i} className="space-y-1.5 md:space-y-2">
              <div className="font-mono text-2xl md:text-4xl font-bold text-dentsu">
                {stat.value}
              </div>
              <div className="text-[10px] md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
