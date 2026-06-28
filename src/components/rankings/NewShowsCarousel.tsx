"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Link from "next/link";
import AutoScroll from "embla-carousel-auto-scroll";
import { useRef } from "react";

export function NewShowsCarousel({ podcasts }: { podcasts: any[] }) {
  const plugin = useRef(
    AutoScroll({ speed: 1, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  if (!podcasts || podcasts.length === 0) return null;

  return (
    <div className="w-full relative px-12 mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold flex items-center">
          <span className="w-3 h-3 rounded-full bg-dentsu animate-pulse mr-3"></span>
          New on the Network
        </h2>
      </div>

      <Carousel
        opts={{ align: "start", loop: true, dragFree: true }}
        plugins={[plugin.current as any]}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {podcasts.map((podcast) => (
            <CarouselItem key={podcast.id} className="pl-4 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
              <Link href={`/dashboard/podcasts/${podcast.id}`}>
                <div className="flex flex-col items-center space-y-3 group cursor-pointer">
                  {/* Circular Avatar */}
                  <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-border shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:border-dentsu">
                    <img 
                      src={podcast.channel_thumbnail_url || podcast.thumbnail_url || 'https://via.placeholder.com/300?text=DP'} 
                      alt={podcast.show_name} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Tiny 'New' Badge inside circle */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-dentsu text-white text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md z-10 opacity-90">
                      New
                    </div>
                  </div>
                  {/* Permanent Text Below */}
                  <div className="text-center px-1 w-full">
                    <h3 className="font-heading text-xs font-bold text-foreground leading-tight line-clamp-1 transition-colors group-hover:text-dentsu">
                      {podcast.show_name}
                    </h3>
                    <span className="text-muted-foreground text-[10px] font-bold tracking-wide mt-1 block">
                      {podcast.subscriber_count > 0 
                        ? (podcast.subscriber_count >= 1000000 
                            ? (podcast.subscriber_count / 1000000).toFixed(1) + 'M' 
                            : podcast.subscriber_count >= 1000 
                              ? (podcast.subscriber_count / 1000).toFixed(0) + 'k' 
                              : podcast.subscriber_count) + ' subscribers'
                        : '-- subscribers'}
                    </span>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-12 bg-card border-border hover:bg-dentsu hover:text-white transition-colors h-12 w-12" />
        <CarouselNext className="hidden md:flex -right-12 bg-card border-border hover:bg-dentsu hover:text-white transition-colors h-12 w-12" />
      </Carousel>
    </div>
  );
}
