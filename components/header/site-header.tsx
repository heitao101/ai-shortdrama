"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButtons } from "@/components/header/auth-buttons";
import { Button } from "@/components/ui/button";
import { Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#generator" as const, labelKey: "features" as const },
  { href: "/#preview" as const, labelKey: "gallery" as const },
];

function NavLink({
  href,
  children,
  active,
  cinema,
  className,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  cinema?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
        cinema
          ? active
            ? "bg-white/15 text-white"
            : "text-white/65 hover:bg-white/10 hover:text-white"
          : active
            ? "bg-brand-50 text-brand-700"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
}

type SiteHeaderProps = {
  variant?: "default" | "cinema";
};

export function SiteHeader({ variant = "default" }: SiteHeaderProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const isPricingActive =
    pathname === "/pricing" || pathname.endsWith("/pricing");
  const cinema = variant === "cinema";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full backdrop-blur-md",
        cinema
          ? "border-b border-white/10 bg-[#0A0A0A]/70 supports-[backdrop-filter]:bg-[#0A0A0A]/55"
          : "border-b border-border/60 bg-card/90 shadow-soft supports-[backdrop-filter]:bg-card/75"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition",
                cinema
                  ? "bg-white/10 text-white group-hover:bg-white/15"
                  : "bg-brand-50 text-brand-600 group-hover:bg-brand-100"
              )}
            >
              <Clapperboard className="h-5 w-5" />
            </span>
            <span
              className={cn(
                "text-lg font-semibold tracking-tight",
                cinema ? "text-white" : "text-foreground"
              )}
            >
              {t("logo")}
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex lg:gap-2"
            aria-label={t("mainNav")}
          >
            {NAV_LINKS.map((item) => (
              <NavLink key={item.labelKey} href={item.href} cinema={cinema}>
                {t(item.labelKey)}
              </NavLink>
            ))}
            <NavLink href="/pricing" active={isPricingActive} cinema={cinema}>
              {t("pricing")}
            </NavLink>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button
            asChild
            variant={isPricingActive ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "md:hidden",
              cinema &&
                "border-white/10 text-white hover:bg-white/10 hover:text-white",
              !cinema &&
                isPricingActive &&
                "bg-brand-50 text-brand-700 hover:bg-brand-100"
            )}
          >
            <Link
              href="/pricing"
              aria-current={isPricingActive ? "page" : undefined}
            >
              {t("pricing")}
            </Link>
          </Button>

          <ThemeToggle />
          <LocaleSwitcher />
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
