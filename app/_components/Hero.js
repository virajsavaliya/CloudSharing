"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { HeroWorkflow } from "./hero-workflow";
import { FeaturesSection } from "./features-section";
import UpgradePlans from './UpgradePlans';
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";


function FeatureItem({ title, description }) {
  return (
    <div className="flex flex-col p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition shadow">
      <h4 className="text-blue-800 font-semibold text-lg mb-1">{title}</h4>
      <p className="text-blue-900 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function CloudMeetAlert({ showCloudMeetAlert, handleDismissCloudMeetAlert }) {
  return (
    <AnimatePresence>
      {showCloudMeetAlert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative w-full max-w-2xl mx-4 rounded-3xl overflow-hidden shadow-2xl bg-white/40 backdrop-blur-lg"
          >
            {/* Background GIF */}
            <div className="absolute inset-0">
              <img
                src="/cloud-meet-intro.gif"
                alt="Cloud Meet Background"
                className="w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center gap-6 p-8">
              {/* Compact Branding */}
              <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight drop-shadow-lg">CLOUD MEET</h1>
              <h2 className="text-2xl font-bold text-blue-500 drop-shadow-lg">COMING SOON</h2>

              <p className="text-blue-900 text-base max-w-md leading-relaxed">
                Get ready to host seamless, secure video meetings directly inside your <span className="font-semibold text-blue-900">CloudSharing</span> workspace.
              </p>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                <FeatureItem title="Easy Scheduling" description="Create and join meetings instantly." />
                <FeatureItem title="Secure Collaboration" description="End-to-end encrypted video calls." />
                <FeatureItem title="Fully Integrated" description="Directly connected to your CloudSharing." />
              </div>

              <div className="text-sm text-blue-700 mt-2">Launching soon — Stay tuned!</div>

              {/* CTA Button */}
              <button
                onClick={handleDismissCloudMeetAlert}
                className="mt-4 px-6 py-3 rounded-full bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 transition"
              >
                Got It!
              </button>

              {/* Close Button */}
              <button
                onClick={handleDismissCloudMeetAlert}
                className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition"
                aria-label="Close"
              >
                <X size={28} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Hero() {
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  // Show Cloud Meet alert every session (not persisted in localStorage)
  const [showCloudMeetAlert, setShowCloudMeetAlert] = useState(true);

  useEffect(() => {
    const cookiePreference = localStorage.getItem('cookieConsent');
    if (!cookiePreference) {
      setShowCookieConsent(true);
    }
    // Remove localStorage check for cloudMeetAlertDismissed
    setShowCloudMeetAlert(true);
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

  const handleDismissCloudMeetAlert = () => {
    setShowCloudMeetAlert(false);
    // No localStorage set, so it will show again on next reload
  };

  return (
    <>
      {/* Cloud Meet Feature Announcement */}
      <CloudMeetAlert
        showCloudMeetAlert={showCloudMeetAlert}
        handleDismissCloudMeetAlert={handleDismissCloudMeetAlert}
      />


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
