"use client";

import React from "react";
import Link from "next/link";
import { HeroWorkflow } from "./hero-workflow";
import { FeaturesSection } from "./features-section";
import UpgradePlans from './UpgradePlans';

function Hero() {
  return (
    <>
      <section className="relative w-full pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="bg-primary/10 blur-3xl rounded-full w-[30rem] h-[30rem] md:w-[60rem] md:h-[60rem] animate-in fade-in-0 duration-1000"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-foreground animate-in fade-in-0 slide-in-from-top-12 duration-500">
              Simple, Secure File Sharing
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl mx-auto animate-in fade-in-0 slide-in-from-top-12 duration-500 delay-200">
              See how easy it is to share files. Upload, get a link, and share it with anyone. Securely and privately.
            </p>
            <div className="mt-8 animate-in fade-in-0 slide-in-from-top-12 duration-500 delay-300">
              <Link
                href="/upload"
                className="inline-block rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white px-6 md:px-8 py-3 text-base md:text-lg font-semibold transition"
              >
                Get Started - It's Free
              </Link>
            </div>
          </div>
          <div className="mt-12">
            <HeroWorkflow />
          </div>
        </div>
      </section>
      <FeaturesSection />
<UpgradePlans />
    </>
  );
}

export default Hero;
