"use client";

import { useTranslations } from "next-intl";
import { SignedIn } from "@clerk/nextjs";
import { Wallet } from "lucide-react";
import { CheckoutButton } from "@/components/pricing/checkout-button";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function RechargeButton() {
  const t = useTranslations("nav");

  return (
    <SignedIn>
      <CheckoutButton
        plan="personal-monthly"
        type="subscription"
        variant="outline"
        size="sm"
        className="hidden gap-1.5 sm:inline-flex sm:w-auto"
      >
        <Wallet className="h-4 w-4" />
        {t("recharge")}
      </CheckoutButton>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="inline-flex gap-1.5 sm:hidden"
      >
        <Link href="/pricing">
          <Wallet className="h-4 w-4" />
          {t("recharge")}
        </Link>
      </Button>
    </SignedIn>
  );
}
