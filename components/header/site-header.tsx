"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButtons } from "@/components/header/auth-buttons";
import { Clapperboard } from "lucide-react";

export function SiteHeader() {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/90 shadow-soft backdrop-blur-md supports-[backdrop-filter]:bg-card/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
            <Clapperboard className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {t("logo")}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/#generator"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("features")}
          </Link>
          <Link
            href="/#preview"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("gallery")}
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("pricing")}
          </Link>
        </nav>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <ThemeToggle />
          <LocaleSwitcher />
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
