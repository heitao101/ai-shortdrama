import { setRequestLocale } from "next-intl/server";
import { HomeClient } from "@/components/home-client";
import { routing, type Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  if (routing.locales.includes(locale as Locale)) {
    setRequestLocale(locale);
  }

  return (
    <div className="page-canvas">
      {/* Hero + generator live on soft gray canvas; content in white cards */}
      <HomeClient />
    </div>
  );
}
