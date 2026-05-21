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
      {/* 首页：粉紫流动背景 + 竖版封面横滑轮播（仅图片，见 HomeClient） */}
      <HomeClient />
    </>
  );
}
