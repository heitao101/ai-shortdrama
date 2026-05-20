import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/header/site-header";
import { PricingPageClient } from "@/components/pricing/pricing-page-client";
import { routing, type Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;

  if (routing.locales.includes(locale as Locale)) {
    setRequestLocale(locale);
  }

  return (
    <div className="page-canvas min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <PricingPageClient />
      </main>
    </div>
  );
}
