"use client";

import { useTranslations } from "next-intl";
import { HeroParticles } from "@/components/home/hero-particles";

export function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="relative px-2 py-12 text-center sm:py-16 lg:py-20">
      <HeroParticles />

      <div className="relative z-10">
        <div className="mb-6 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/70 backdrop-blur-sm">
          {t("badge")}
        </div>

        <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
          {t("title")}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
          {t("subtitle")}
        </p>
      </div>
    </section>
  );
}
