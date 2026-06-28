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
                <div className="group relative aspect-square rounded-full overflow-hidden border-4 border-border shadow-md transition-all hover:scale-105 hover:shadow-xl hover:border-dentsu cursor-pointer">
                  <img 
                    src={podcast.channel_profile_image_url || podcast.cover_art_url || 'https://via.placeholder.com/300?text=DP'} 
                    alt={podcast.show_name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-dentsu text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full mb-1">
                      New
                    </span>
                    <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 shadow-sm">
                      {podcast.show_name}
                    </h3>
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
