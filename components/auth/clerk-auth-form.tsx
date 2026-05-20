"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import type { Locale } from "@/i18n/routing";

type ClerkAuthFormProps = {
  mode: "sign-in" | "sign-up";
  locale: Locale;
};

export function ClerkAuthForm({ mode, locale }: ClerkAuthFormProps) {
  const signInPath = `/${locale}/sign-in`;
  const signUpPath = `/${locale}/sign-up`;

  if (mode === "sign-in") {
    return (
      <SignIn
        routing="path"
        path={signInPath}
        signUpUrl={signUpPath}
        appearance={clerkAppearance}
      />
    );
  }

  return (
    <SignUp
      routing="path"
      path={signUpPath}
      signInUrl={signInPath}
      appearance={clerkAppearance}
    />
  );
}
