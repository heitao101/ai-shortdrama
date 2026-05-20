"use client";

import { useTranslations } from "next-intl";

export function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="px-2 py-14 text-center sm:py-16 lg:py-20">
      <div className="mb-6 inline-flex items-center rounded-full border border-border/80 bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-soft">
        {t("badge")}
      </div>

      <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
        {t("title")}
      </h1>

      <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        {t("subtitle")}
      </p>
    </section>
  );
}
