"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LogIn, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignInPrompt() {
  const t = useTranslations("auth");

  return (
    <section id="generator" className="surface-card p-10 sm:p-14">
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Clapperboard className="h-7 w-7" />
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("promptTitle")}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {t("promptDescription")}
        </p>

        <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button variant="default" size="lg" asChild className="gap-2 shadow-soft">
            <Link href="/sign-in">
              <LogIn className="h-5 w-5" />
              {t("signInCta")}
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/sign-up">{t("signUpCta")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
