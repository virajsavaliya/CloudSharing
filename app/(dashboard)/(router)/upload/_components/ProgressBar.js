"use client";
import React from "react";
import { motion } from "framer-motion";

function ProgressBar({ progress }) {
  // Convert progress to a string with only two decimal places, without rounding
  const formattedProgress = progress.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

  return (
    <div className="w-full bg-gray-300 rounded-full h-5 mt-3 relative overflow-hidden shadow-md">
      <motion.div
        className="h-5 rounded-full bg-gradient-to-r from-blue-500 to-blue-700"
        initial={{ width: 0 }}
        animate={{ width: `${formattedProgress}%` }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
        <span className="text-white">{formattedProgress}%</span>
      </div>
    </div>
  );
}

export default ProgressBar;
