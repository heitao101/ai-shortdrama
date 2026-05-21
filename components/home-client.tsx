"use client";



import { useState } from "react";

import { SignedIn, SignedOut } from "@clerk/nextjs";

import { SiteHeader } from "@/components/header/site-header";

import { HeroSection } from "@/components/hero-section";

import { HomeCinematicBackground } from "@/components/home/home-cinematic-background";

import { FeaturedCarousel } from "@/components/home/featured-carousel";

import { SignInPrompt } from "@/components/auth/sign-in-prompt";

import {

  DramaGenerator,

  type GeneratedVideoResult,

} from "@/components/generator/drama-generator";

import { ResultPreview } from "@/components/preview/result-preview";

import { PricingSection } from "@/components/pricing/pricing-section";



export function HomeClient() {

  const [videoResult, setVideoResult] = useState<GeneratedVideoResult | null>(

    null

  );

  const [isGenerating, setIsGenerating] = useState(false);



  return (

    <div className="home-cinema relative min-h-screen text-white">

      <HomeCinematicBackground />



      <div className="relative z-10">

        <SiteHeader variant="cinema" />



        <main>

          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

            <HeroSection />

          </div>



          <div className="mt-4 sm:mt-6">

            <FeaturedCarousel />

          </div>



          <div className="mx-auto mt-14 max-w-6xl space-y-14 px-4 pb-28 sm:mt-16 sm:space-y-16 sm:px-6 lg:px-8">

            <SignedOut>

              <div className="home-content-card">

                <SignInPrompt />

              </div>

            </SignedOut>

            <SignedIn>

              <div className="home-content-card space-y-14 sm:space-y-16">

                <DramaGenerator

                  onGenerate={setVideoResult}

                  onGeneratingChange={setIsGenerating}

                />

                <ResultPreview

                  result={videoResult}

                  isGenerating={isGenerating}

                />

              </div>

            </SignedIn>



            <div className="home-content-card">

              <PricingSection />

            </div>

          </div>

        </main>

      </div>

    </div>

  );

}

