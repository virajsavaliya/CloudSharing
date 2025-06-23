"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ImageWithFallback from "./ImageWithFallback";
import FooterWeb from "./FooterWeb";
import Header from "./Header";
import "./Hero.css"; // Import the CSS file

function HeroSection() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  return (
    <section className="hero flex items-center justify-between p-8 max-w-screen-xl mx-auto">
      <div className="left text-blue-900 max-w-lg">
        <h1 className="text-4xl font-bold mb-4 leading-tight">
          Upload, Save<br />
          <span className="block mt-2">and easily</span>
          <span className="block mt-2">Share your files</span>
          <span className="block mt-2">in one place</span>
        </h1>
        <p className="text-lg mb-6">Drag and drop your file directly on our cloud and share it with friends securely with a password and send it via email.</p>
        <div className="buttons flex space-x-4">
            <a href="/upload" className="get-started bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-300">Get Started</a>
          <a href="#Feature-section" className="features bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-900 transition duration-300">Features</a>
        </div>
      </div>
      <div className="right max-w-lg">
        <ImageWithFallback 
        src="/download.svg" 
        style={{ width: '600px', height: '450px' }}
        alt="Cloud File Sharing Illustration"
        />
        <p className="placeholder" style={{ display: 'none' }}>Image not available</p>
      </div>
    </section>
  );
}

function FeatureSection() {
  return (
    <section id="Feature-section" className="features-section">
      <h2 className="text-center text-4xl font-bold text-gray-800 mb-12">Features</h2>
      <div className="cards flex flex-wrap justify-center gap-8">
        <div className="card card-1 bg-white rounded-2xl shadow-lg p-8 text-center transition-transform transform hover:scale-105">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Send Files Anywhere</h3>
          <p className="text-gray-600">Send Files Anywhere allows you to easily and securely send files to anyone, anywhere in the world with just a few clicks, ensuring smooth and efficient transfers.</p>
        </div>
        <div className="card card-2 bg-white rounded-2xl shadow-lg p-8 text-center transition-transform transform hover:scale-105">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Password Protected</h3>
          <p className="text-gray-600">Ensure your files are protected with secure password options, giving you peace of mind knowing that only authorized individuals can access and view your sensitive documents.</p>
        </div>
        <div className="card card-3 bg-white rounded-2xl shadow-lg p-8 text-center transition-transform transform hover:scale-105">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure and Encrypted</h3>
          <p className="text-gray-600">Your files are secure with advanced encryption techniques, ensuring that all data is fully protected during transfer and storage, keeping your information safe from unauthorized access.</p>
        </div>
      </div>
    </section>
  );
}

function Hero() {
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setShowCookieConsent(true);
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowCookieConsent(false);
    // Set actual cookie
    document.cookie = "cookieConsent=accepted; max-age=31536000; path=/";
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setShowCookieConsent(false);
    // Set cookie with declined preference
    document.cookie = "cookieConsent=declined; max-age=31536000; path=/";
  };

  return (
    <div className="overflow-x-hidden relative min-h-screen">
      <HeroSection />
      <FeatureSection />

      {/* Cookie Consent Popup */}
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

      {/* Footer Links */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex justify-center md:justify-end items-center gap-6 text-sm text-gray-600">
          <a href="/terms" className="hover:text-gray-900">Terms & Conditions</a>
          <span>•</span>
          <a href="/privacy" className="hover:text-gray-900">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}

export default Hero;
