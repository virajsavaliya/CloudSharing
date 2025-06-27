"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { HeroWorkflow } from "./hero-workflow";
import { FeaturesSection } from "./features-section";
import UpgradePlans from './UpgradePlans';

function Hero() {
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  useEffect(() => {
    // Check localStorage for cookie preference on load
    const cookiePreference = localStorage.getItem('cookieConsent');
    if (!cookiePreference) {
      setShowCookieConsent(true); // Show consent bar if not yet set
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowCookieConsent(false);
    document.cookie = "cookieConsent=accepted; max-age=31536000; path=/";
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setShowCookieConsent(false);
    document.cookie = "cookieConsent=declined; max-age=31536000; path=/";
  };

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

      {/* Footer */}
      <div className="w-full bg-gray-50 border-t">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex justify-center md:justify-end items-center gap-6 text-sm text-gray-600">
          <a href="/terms" className="hover:text-gray-900">Terms & Conditions</a>
          <span>•</span>
          <a href="/privacy" className="hover:text-gray-900">Privacy Policy</a>
        </div>
      </div>

      {/* Cookie Consent Bar */}
      {showCookieConsent && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50 p-4 md:p-6">
          <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              <p>
                We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">Learn more</a>
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleDeclineCookies}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptCookies}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Hero;
