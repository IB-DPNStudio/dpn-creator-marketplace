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
                <div className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-border shadow-md transition-all hover:scale-105 hover:shadow-xl cursor-pointer">
                  <img 
                    src={podcast.thumbnail_url || 'https://via.placeholder.com/300x400?text=Cover+Art'} 
                    alt={podcast.show_name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100"></div>
                  
                  <div className="absolute bottom-0 left-0 p-4 w-full">
                    <span className="bg-dentsu text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded mb-2 inline-block">
                      New
                    </span>
                    <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 shadow-sm">
                      {podcast.show_name}
                    </h3>
                    <p className="text-white/80 text-sm mt-1 flex items-center">
                      <span className="font-mono font-medium">
                        {podcast.average_views_per_episode > 1000000 
                          ? (podcast.average_views_per_episode / 1000000).toFixed(1) + 'M' 
                          : podcast.average_views_per_episode > 1000
                            ? (podcast.average_views_per_episode / 1000).toFixed(0) + 'k'
                            : Math.round(podcast.average_views_per_episode || 0)}
                      </span>
                      <span className="ml-1 text-xs uppercase tracking-wider opacity-70">Avg Views</span>
                    </p>
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
