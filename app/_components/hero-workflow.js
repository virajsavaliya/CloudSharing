"use client";

import React from "react";
import { UploadCloud, Shield, Link as LinkIcon, Clock, Download, BarChart3, Share2 } from "lucide-react";

const Feature = ({ icon, title, description, alignment = 'left' }) => (
  <div className={`flex items-start gap-4 ${alignment === 'right' ? 'flex-row-reverse text-right' : 'text-left'}`}>
    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
      {icon}
    </div>
    <div className="mt-1">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

export function HeroWorkflow() {
  const leftFeatures = [
    { icon: <UploadCloud className="w-6 h-6" />, title: "Easy Uploads", description: "Drag & drop files to instantly create a shareable link." },
    { icon: <Shield className="w-6 h-6" />, title: "Secure & Private", description: "Files are encrypted and accessible only via a unique link." },
    { icon: <Clock className="w-6 h-6" />, title: "Link Expiration", description: "For security, all links automatically expire after 24 hours." },
  ];

  const rightFeatures = [
    { icon: <LinkIcon className="w-6 h-6" />, title: "Shareable Links", description: "Generate a unique link for each file to share anywhere." },
    { icon: <Download className="w-6 h-6" />, title: "Fast Downloads", description: "Recipients download files instantly, no sign-up needed." },
    { icon: <BarChart3 className="w-6 h-6" />, title: "Download Tracking", description: "See how many times your shared files have been downloaded." },
  ];

  return (
    <div className="bg-white opacity-8 border rounded-xl shadow-lg w-full max-w-6xl mx-auto p-6 md:p-16">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-y-12 md:gap-x-12">
        {/* Left Features */}
        <div className="space-y-8 md:space-y-12 order-2 md:order-none">
          {leftFeatures.map((feature, index) => (
            <div key={index} className="animate-in fade-in-0 slide-in-from-left-24 duration-700" style={{ animationDelay: `${index * 150}ms` }}>
              <Feature {...feature} alignment="right" />
            </div>
          ))}
        </div>

        {/* Center Icon */}
        <div className="flex justify-center items-center order-1 md:order-none animate-in fade-in-0 zoom-in-50 duration-700">
          <div className="relative z-10 flex items-center justify-center w-24 h-24 md:w-40 md:h-40 rounded-full bg-card shadow-2xl border-4 border-primary/10">
            <Share2 className="w-12 h-12 md:w-20 md:h-20 text-primary" />
          </div>
        </div>

        {/* Right Features */}
        <div className="space-y-8 md:space-y-12 order-3 md:order-none">
          {rightFeatures.map((feature, index) => (
            <div key={index} className="animate-in fade-in-0 slide-in-from-right-24 duration-700" style={{ animationDelay: `${index * 150}ms` }}>
              <Feature {...feature} alignment="left" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
