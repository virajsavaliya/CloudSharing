// ProgressBar.js
import React from "react";
import { motion } from "framer-motion";

function ProgressBar({ progress = 0 }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-gray-300 shadow-md bg-gray-100">
      {/* Water wave container */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: `${100 - pct}%` }}
        transition={{ ease: "easeOut", duration: 0.6 }}
        className="absolute inset-0 overflow-hidden"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-600 to-blue-400" />

        {/* Wave layers */}
        <div className="absolute bottom-0 left-0 w-[200%] h-[120px] animate-wave">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-full fill-blue-300 opacity-70"
          >
            <path d="M0,40 C300,120 900,0 1200,80 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-[200%] h-[120px] animate-wave-slow">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-full fill-blue-500 opacity-80"
          >
            <path d="M0,60 C400,-20 800,140 1200,60 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </motion.div>

      {/* Progress number + text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-white">
        <motion.div
          key={pct}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-3xl font-bold drop-shadow-md"
        >
          {pct}%
        </motion.div>
        <div className="text-sm font-medium mt-1 drop-shadow-sm">
          {pct < 100 ? "Uploading..." : "Completed!"}
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
