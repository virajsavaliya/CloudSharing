'use client';

import React, { useState, useEffect, useRef } from "react";
import { UploadCloud, Shield, Link as Clock, Download, ChevronLeft, ChevronRight, MessageSquare, Video } from "lucide-react";
import { motion, useMotionValue, useAnimation } from "framer-motion";

const features = [
  { icon: <UploadCloud className="w-10 h-10 text-primary" />, title: "Easy Uploads", description: "Drag and drop files to instantly create a shareable link." },
  { icon: <Shield className="w-10 h-10 text-primary" />, title: "Secure & Private", description: "Your files are encrypted and only accessible via a unique, secure link." },
  { icon: <MessageSquare className="w-10 h-10 text-primary" />, title: "Chat", description: "Connect instantly with users through real-time messaging." },
  { icon: <Clock className="w-10 h-10 text-primary" />, title: "Link Expiration", description: "For your security, all links automatically expire after 24 hours." },
  { icon: <Download className="w-10 h-10 text-primary" />, title: "Fast Downloads", description: "Recipients can download your files instantly with no sign-up required." },
  { icon: <Video className="w-10 h-10 text-primary" />, title: "Meeting", description: "Host or join high-quality video meetings with ease." },
];

const FeatureCard = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center w-[300px] h-[300px] bg-white rounded-2xl p-6 shadow-lg text-center mx-4">
    <div className="bg-primary/10 p-4 rounded-xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export function FeaturesSection() {
  const [width, setWidth] = useState(0);
  const carouselRef = useRef(null);
  const x = useMotionValue(0);
  const controls = useAnimation();

  // Prepare duplicated slides for infinite loop
  const slides = [features[features.length - 1], ...features, features[0]];

  useEffect(() => {
    const updateWidth = () => {
      if (carouselRef.current) {
        setWidth(carouselRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleDragEnd = (_, info) => {
    const distance = info.offset.x;

    if (distance < -50) {
      nextSlide();
    } else if (distance > 50) {
      prevSlide();
    } else {
      controls.start({ x: -width }); // Snap back if not enough swipe
    }
  };

  const nextSlide = () => {
    controls.start({
      x: -width * 2,
      transition: { duration: 0.4 },
    }).then(() => {
      controls.set({ x: -width });
    });
  };

  const prevSlide = () => {
    controls.start({
      x: 0,
      transition: { duration: 0.4 },
    }).then(() => {
      controls.set({ x: -width });
    });
  };

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

        <div
          ref={carouselRef}
          className="relative flex items-center justify-center overflow-hidden group"
        >
          {/* Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 md:left-2 z-10 bg-white p-2 rounded-full shadow hover:bg-gray-100 flex"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <motion.div
            drag="x"
            dragConstraints={{ left: -width * 2, right: 0 }}
            onDragEnd={handleDragEnd}
            animate={controls}
            initial={{ x: -width }}
            className="flex cursor-grab"
            style={{ x }}
          >
            {slides.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </motion.div>

          <button
            onClick={nextSlide}
            className="absolute right-4 md:right-2 z-10 bg-white p-2 rounded-full shadow hover:bg-gray-100 flex"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
