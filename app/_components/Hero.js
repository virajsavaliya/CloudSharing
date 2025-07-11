"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { HeroWorkflow } from "./hero-workflow";
import { FeaturesSection } from "./features-section";
import UpgradePlans from './UpgradePlans';
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";


function FeatureItem({ title, description, icon }) {
  return (
    <div className="flex flex-col items-center p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition shadow">
      {icon && <div className="mb-2">{icon}</div>}
      <h4 className="text-blue-800 font-semibold text-lg mb-1">{title}</h4>
      <p className="text-blue-900 text-sm leading-relaxed text-center">{description}</p>
    </div>
  );
}

function Hero() {
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  useEffect(() => {
    const cookiePreference = localStorage.getItem('cookieConsent');
    if (!cookiePreference) {
      setShowCookieConsent(true);
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
      {/* Banner removed */}

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

      {/* --- SECOND ADVERTISEMENT: Horizontal Banner --- */}
      <div
        style={{ marginTop: "3.5rem" }}
        className="w-full bg-blue-700 py-8"
      >
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
          <span className="text-white font-bold text-xl md:text-2xl flex items-center gap-2 md:gap-3 mb-4 md:mb-0">
            {/* Meet Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 md:w-9 md:h-9">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            {/* Chat Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 md:w-9 md:h-9">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
            <span>Now Live: Video Calls & Chats!</span>
          </span>
          <span className="hidden md:inline text-blue-200 text-xl">|</span>
          <span className="text-blue-100 text-base md:text-lg text-center md:text-left flex flex-col md:flex-row items-center gap-2">
            <span>Experience seamless collaboration with our brand new communication suite.</span>
            <Link
              href="/files"
              className="inline-flex items-center gap-2 mt-3 md:mt-0 md:ml-4 px-5 py-2 rounded-full bg-white text-blue-700 font-bold text-base md:text-lg shadow hover:bg-blue-100 transition"
              style={{ whiteSpace: "nowrap" }}
            >
              {/* Try Now Icon */}
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="11" fill="#2563eb" opacity="0.15" />
                <path d="M8 12h8m0 0-3-3m3 3-3 3" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Try Now
            </Link>
          </span>
        </div>
      </div>

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
