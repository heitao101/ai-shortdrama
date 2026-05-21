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
    <>
      {/* 首页：生成器（剧本 / 参考图 / 时长 / 生成）与预览，见 HomeClient */}
      <HomeClient />
    </>
  );
}
