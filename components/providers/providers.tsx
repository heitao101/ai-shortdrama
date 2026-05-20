"use client";

import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { ThemeProvider } from "@/components/theme-provider";
import { clerkAppearance } from "@/lib/clerk-appearance";
import type { Locale } from "@/i18n/routing";

type ProvidersProps = {
  children: ReactNode;
  locale: Locale;
  messages: AbstractIntlMessages;
};

/**
 * Provider nesting (outer → inner):
 *   ClerkProvider → NextIntlClientProvider → ThemeProvider
 */
export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ThemeProvider>{children}</ThemeProvider>
      </NextIntlClientProvider>
    </ClerkProvider>
  );
}
