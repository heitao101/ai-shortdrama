import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ClerkAuthForm } from "@/components/auth/clerk-auth-form";
import { routing, type Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("signUpTitle") };
}

export default async function SignUpPage({ params }: Props) {
  const { locale } = await params;

  if (routing.locales.includes(locale as Locale)) {
    setRequestLocale(locale);
  }

  return <ClerkAuthForm mode="sign-up" locale={locale as Locale} />;
}
