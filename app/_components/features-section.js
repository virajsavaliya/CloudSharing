// File: app/_components/features-section.js

import React from "react";
import { UploadCloud, Shield, Lock, Users, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: <UploadCloud className="w-16 h-16 text-primary/80" />,
    title: "Instant Drag & Drop",
    description: "Effortlessly upload and share files with a simple drag-and-drop interface."
  },
  {
    icon: <Lock className="w-16 h-16 text-primary/80" />,
    title: "Password Protection",
    description: "Add an extra layer of security with password-protected shareable links."
  },
  {
    icon: <Users className="w-16 h-16 text-primary/80" />,
    title: "Real-time Collaboration",
    description: "Work together on shared documents in real-time without leaving the app."
  },
  {
    icon: <LinkIcon className="w-16 h-16 text-primary/80" />,
    title: "Customizable Links",
    description: "Create branded and custom shareable links for a professional touch."
  },
  {
    icon: <Shield className="w-16 h-16 text-primary/80" />,
    title: "Secure & Encrypted",
    description: "Your data is protected with end-to-end encryption and robust security measures."
  },
];

const FeatureCard = ({ icon, title, description }) => (
  <motion.div
    className="relative group p-8 bg-white backdrop-blur-md rounded-3xl shadow-lg border border-gray-200 overflow-hidden"
    whileHover={{ scale: 1.03 }}
    transition={{ duration: 0.3 }}
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div className="relative z-10 flex flex-col items-start text-left">
      <div className="p-4 bg-primary/10 rounded-2xl mb-6">
        {React.cloneElement(icon, { className: "w-8 h-8 text-primary" })}
      </div>
      <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </motion.div>
);

export function FeaturesSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  return (
    <section id="features" className="w-full py-16 md:py-24 bg-gray-50 transition-colors">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-primary text-sm font-semibold tracking-wider uppercase mb-2"
          >
            Explore Features
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tighter text-gray-900"
          >
            Why You'll Love CloudSharing <br />
            <span className="text-primary">explore all-in-one platform.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-4 text-lg text-gray-600"
          >
            Everything you need for simple, fast, and secure file sharing.
          </motion.p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}