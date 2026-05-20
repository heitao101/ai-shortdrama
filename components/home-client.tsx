"use client";

import { useState } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { SiteHeader } from "@/components/header/site-header";
import { HeroSection } from "@/components/hero-section";
import { SignInPrompt } from "@/components/auth/sign-in-prompt";
import {
  DramaGenerator,
  type GeneratedScene,
} from "@/components/generator/drama-generator";
import { ResultPreview } from "@/components/preview/result-preview";
import { PricingSection } from "@/components/pricing/pricing-section";

export function HomeClient() {
  const [scenes, setScenes] = useState<GeneratedScene[]>([]);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 pb-28 sm:px-6 lg:px-8">
        <HeroSection />

        <div className="mt-10 space-y-14 sm:mt-14 sm:space-y-16">
          <SignedOut>
            <SignInPrompt />
          </SignedOut>
          <SignedIn>
            <DramaGenerator onGenerate={setScenes} />
            <ResultPreview scenes={scenes} />
          </SignedIn>

          <PricingSection />
        </div>
      </main>
    </>
  );
}
