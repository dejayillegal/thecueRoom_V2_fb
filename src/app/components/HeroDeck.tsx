
"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";

type Item = { title:string; source:string; url:string; publishedAt:string; summary:string; image:string; tags:string[]; };

interface HeroDeckProps {
    items: Item[];
    autoPlay?: boolean;
    loop?: boolean;
    layout?: 'landing' | 'dashboard';
    className?: string;
}

export default function HeroDeck({ items, autoPlay = false, loop = false, layout = 'dashboard', className }: HeroDeckProps) {
  const list = useMemo(()=> items.slice(0,7), [items]);
  const [emblaApi, setEmblaApi] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const snapTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index)
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }
    emblaApi.on('select', onSelect)
    onSelect();
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi])

  if (!list.length) return null;
  
  const plugins = useMemo(() => {
      return autoPlay ? [Autoplay({ playOnInit: true, delay: 5000, stopOnInteraction: true })] : [];
  }, [autoPlay]);

  return (
    <section aria-label="Spotlight" className={cn("mb-8 -mx-4 md:mx-0", className)}>
      <Carousel
        setApi={setEmblaApi}
        opts={{
          align: "start",
          loop: loop,
        }}
        plugins={plugins}
        className="relative"
      >
        <CarouselContent>
            {list.map((it, i) => (
              <CarouselItem key={it.url} className="relative basis-full md:basis-1/1">
                <Link
                  href={it.url}
                  target="_blank"
                  rel="external noopener noreferrer"
                  className="relative block h-[50vh] md:h-[56vh] ring-1 ring-neutral-800 bg-[#0f0f0f] group"
                >
                  <Image
                    src={it.image}
                    alt={it.title}
                    fill
                    sizes="100vw"
                    priority={i < 1}
                    fetchPriority={i < 2 ? "high" : "auto"}
                    className="object-cover will-change-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 p-4 md:p-8 max-w-3xl">
                    <div className="text-[10px] md:text-[11px] uppercase tracking-wide text-neutral-300">
                      {it.source}
                    </div>
                    <h3 className="mt-1 text-xl md:text-3xl font-semibold leading-tight group-hover:text-[#D7FF3C] transition-colors">
                      {it.title}
                    </h3>
                    <p className="mt-2 text-xs md:text-sm text-neutral-300 line-clamp-2 md:line-clamp-3">
                      {it.summary}
                    </p>
                  </div>
                </Link>
              </CarouselItem>
            ))}
        </CarouselContent>

        <CarouselPrevious className="tcr-arrow left-2 md:left-4" />
        <CarouselNext className="tcr-arrow right-2 md:right-4" />

        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {list.map((_,i)=>(
            <button key={i} aria-label={`Go to slide ${i+1}`} onClick={()=> snapTo(i)}
              className={`tcr-dot ${i===selectedIndex ? "opacity-100 scale-100":"opacity-50 scale-90"}`} />
          ))}
        </div>
      </Carousel>
    </section>
  );
}
