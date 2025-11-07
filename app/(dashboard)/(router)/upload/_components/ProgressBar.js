// ProgressBar.js
import React from "react";
import { motion } from "framer-motion";

function ProgressBar({ progress = 0 }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="relative w-full h-64 rounded-3xl overflow-hidden border-2 border-blue-200 shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-300 to-transparent animate-shimmer"></div>
      </div>

      {/* Water wave container */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: `${100 - pct}%` }}
        transition={{ ease: "easeOut", duration: 0.8 }}
        className="absolute inset-0 overflow-hidden"
      >
        {/* Main gradient background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#007dfc] via-[#2196f3] to-[#42a5f5]" />

        {/* Animated light rays */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>

        {/* Multiple wave layers for realistic effect */}
        {/* Wave Layer 1 - Front wave */}
        <div className="absolute bottom-0 left-0 w-[200%] h-32 animate-wave">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-full fill-white/30"
          >
            <path d="M0,50 C150,80 350,0 600,50 C850,100 1050,20 1200,50 L1200,120 L0,120 Z"></path>
          </svg>
        </div>

        {/* Wave Layer 2 - Middle wave */}
        <div className="absolute bottom-0 left-0 w-[200%] h-32 animate-wave-slow">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-full fill-blue-400/40"
          >
            <path d="M0,60 C200,10 400,90 600,60 C800,30 1000,80 1200,60 L1200,120 L0,120 Z"></path>
          </svg>
        </div>

        {/* Wave Layer 3 - Back wave */}
        <div className="absolute bottom-0 left-0 w-[200%] h-28 animate-wave" style={{ animationDuration: '10s' }}>
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-full fill-[#007dfc]/50"
          >
            <path d="M0,70 C300,100 600,40 900,70 C1050,85 1150,60 1200,70 L1200,120 L0,120 Z"></path>
          </svg>
        </div>

        {/* Floating bubbles effect */}
        {pct > 0 && pct < 100 && (
          <>
            <motion.div
              animate={{ y: [0, -200], opacity: [0.6, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 0.5 }}
              className="absolute bottom-10 left-[20%] w-3 h-3 bg-white/40 rounded-full"
            />
            <motion.div
              animate={{ y: [0, -200], opacity: [0.5, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 1 }}
              className="absolute bottom-10 left-[50%] w-2 h-2 bg-white/50 rounded-full"
            />
            <motion.div
              animate={{ y: [0, -200], opacity: [0.7, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 0.8 }}
              className="absolute bottom-10 left-[75%] w-2.5 h-2.5 bg-white/30 rounded-full"
            />
            <motion.div
              animate={{ y: [0, -200], opacity: [0.6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 0.3 }}
              className="absolute bottom-10 left-[35%] w-1.5 h-1.5 bg-white/60 rounded-full"
            />
          </>
        )}
      </motion.div>

      {/* Progress text container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        {/* Percentage with glow effect */}
        <motion.div
          key={pct}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          className="relative"
        >
          {/* Glow background */}
          <div className="absolute inset-0 blur-2xl bg-white/50 scale-150"></div>
          
          {/* Percentage number */}
          <div className="relative text-7xl font-black text-white drop-shadow-2xl">
            {pct}
            <span className="text-4xl">%</span>
          </div>
        </motion.div>

        {/* Status text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 px-6 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg"
        >
          <div className="text-sm font-semibold text-[#007dfc] flex items-center gap-2">
            {pct < 100 ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-600">Upload Complete!</span>
              </>
            )}
          </div>
        </motion.div>

        {/* File icon indicator (optional) */}
        {pct < 100 && (
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-6 text-white/80"
          >
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Ripple effect on completion */}
      {pct === 100 && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 rounded-3xl border-4 border-green-400"
        />
      )}
    </div>
  );
}

export default ProgressBar;
