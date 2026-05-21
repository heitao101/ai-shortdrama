"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { FEATURED_DRAMA_SLIDES } from "@/lib/featured-carousel-data";
import { cn } from "@/lib/utils";

const CARD_WIDTH =
  "w-[132px] sm:w-[148px] md:w-[160px] lg:w-[172px]";

export function FeaturedCarousel() {
  const t = useTranslations("carousel");

  const autoplay = useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );

  return (
    <section
      className="relative w-full"
      aria-labelledby="featured-carousel-title"
    >
      <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2">
        <div className="mb-5 px-4 text-center sm:mb-6 sm:px-6 lg:px-8">
          <h2
            id="featured-carousel-title"
            className="text-xl font-semibold tracking-tight text-white sm:text-2xl"
          >
            {t("title")}
          </h2>
          <p className="mt-1.5 text-sm text-white/60">{t("subtitle")}</p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
            containScroll: "trimSnaps",
          }}
          plugins={[autoplay.current]}
          className="w-full px-4 sm:px-6 lg:px-8"
        >
          <CarouselContent className="-ml-3 md:-ml-4">
            {FEATURED_DRAMA_SLIDES.map((slide) => (
              <CarouselItem
                key={slide.id}
                className="basis-auto pl-3 md:pl-4"
              >
                <article
                  className={cn(
                    CARD_WIDTH,
                    "group relative aspect-[2/3] shrink-0 overflow-hidden rounded-xl bg-zinc-900",
                    "shadow-[0_8px_28px_-6px_rgba(0,0,0,0.55)]",
                    "ring-1 ring-white/10 transition-all duration-300",
                    "hover:scale-[1.04] hover:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.65)] hover:ring-white/20"
                  )}
                >
                  <Image
                    src={slide.imageUrl}
                    alt={slide.alt}
                    fill
                    sizes="172px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    priority={slide.id === "1"}
                    unoptimized
                  />
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious
            className={cn(
              "hidden border-white/20 bg-black/45 text-white hover:bg-black/65 hover:text-white sm:-left-1 sm:inline-flex md:left-0",
              "h-9 w-9"
            )}
          />
          <CarouselNext
            className={cn(
              "hidden border-white/20 bg-black/45 text-white hover:bg-black/65 hover:text-white sm:-right-1 sm:inline-flex md:right-0",
              "h-9 w-9"
            )}
          />
        </Carousel>

        <p className="mt-4 px-4 text-center text-xs text-white/45 sm:hidden">
          {t("swipeHint")}
        </p>
      </div>
    </section>
  );
}
