'use client';

import React, { useState, useEffect, useRef } from "react";
import { UploadCloud, Shield, Link as LinkIcon, Clock, Download, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: <UploadCloud className="w-10 h-10 text-primary" />, title: "Easy Uploads", description: "Drag and drop files to instantly create a shareable link." },
  { icon: <Shield className="w-10 h-10 text-primary" />, title: "Secure & Private", description: "Your files are encrypted and only accessible via a unique, secure link." },
  { icon: <LinkIcon className="w-10 h-10 text-primary" />, title: "Shareable Links", description: "Generate a unique link for each file, making it easy to share anywhere." },
  { icon: <Clock className="w-10 h-10 text-primary" />, title: "Link Expiration", description: "For your security, all links automatically expire after 24 hours." },
  { icon: <Download className="w-10 h-10 text-primary" />, title: "Fast Downloads", description: "Recipients can download your files instantly with no sign-up required." },
  { icon: <BarChart3 className="w-10 h-10 text-primary" />, title: "Download Tracking", description: "Keep track of how many times your shared files have been downloaded." },
];

const FeatureCard = ({ icon, title, description }) => (
  <div className="min-w-[250px] md:min-w-[300px] w-[250px] md:w-[300px] flex-shrink-0 border rounded-lg p-6 shadow hover:shadow-lg transition-all bg-white snap-start">
    <div className="bg-primary/10 rounded-lg p-3 w-fit mb-4 text-primary">{icon}</div>
    <h3 className="font-bold text-xl mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const UpgradeCard = ({ title, description, buttonText, onClick }) => (
  <div className="flex flex-col justify-between border rounded-lg p-6 shadow hover:shadow-lg transition-all bg-white text-center w-full max-w-sm mx-auto">
    <div>
      <h3 className="font-bold text-2xl mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
    </div>
    <button
      onClick={onClick}
      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full transition"
    >
      {buttonText}
    </button>
  </div>
);


export function FeaturesSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);
  const extendedFeatures = [...features, ...features];

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % extendedFeatures.length);
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + extendedFeatures.length) % extendedFeatures.length);
  };

  useEffect(() => {
    const slideTimer = setInterval(goToNextSlide, 3000);
    return () => clearInterval(slideTimer);
  }, [goToNextSlide]);

  useEffect(() => {
    if (sliderRef.current) {
      const singleSlideWidth = 270;
      const scrollPosition = currentSlide * singleSlideWidth;
      sliderRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [currentSlide]);

  return (
    <section id="features" className="w-full py-16 md:py-24 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-extrabold tracking-tighter text-gray-900"
          >
            Why You'll Love CloudSharing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="mt-4 text-lg text-gray-600 max-w-xl mx-auto"
          >
            Everything you need for simple, fast, and secure file sharing.
          </motion.p>
        </div>

        <div className="relative flex items-center overflow-x-auto no-scrollbar">
          <button onClick={goToPrevSlide} className="hidden md:flex absolute left-0 z-10 bg-white p-2 rounded-full shadow hover:bg-gray-100">
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div
            ref={sliderRef}
            className="flex gap-6 px-2 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory"
          >
            {extendedFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>

          <button onClick={goToNextSlide} className="hidden md:flex absolute right-0 z-10 bg-white p-2 rounded-full shadow hover:bg-gray-100">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      
    </section>
  );
}
