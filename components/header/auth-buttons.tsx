"use client";

import { useTranslations } from "next-intl";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { RechargeButton } from "@/components/header/recharge-button";
import { CreditsBadge } from "@/components/header/credits-badge";

export function AuthButtons() {
  const t = useTranslations("nav");

  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            {t("signIn")}
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button variant="default" size="sm">
            {t("signUp")}
          </Button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <CreditsBadge className="hidden md:inline-flex" />
        <RechargeButton />
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-9 w-9 ring-2 ring-brand-100",
              userButtonPopoverCard: "bg-card border border-border shadow-card",
              userButtonPopoverActionButton: "hover:bg-muted",
            },
          }}
        />
      </SignedIn>
    </>
  );
}
