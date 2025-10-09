// FilePreview.js
import { X } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

// Map extensions → svg filenames
const extToIcon = {
  // docs
  doc: "word.svg",
  docx: "word.svg",
  xls: "excel.svg",
  xlsx: "excel.svg",
  ppt: "powerpoint.svg",
  pptx: "powerpoint.svg",

  // pdf
  pdf: "pdf.svg",

  // archives
  zip: "archive.svg",
  rar: "archive.svg",
  "7z": "archive.svg",

  // images
  png: "image.svg",
  jpg: "image.svg",
  jpeg: "image.svg",
  gif: "image.svg",
  svg: "image.svg",
  heic: "image.svg",
  heif: "image.svg",

  // video
  mp4: "video.svg",
  mov: "video.svg",
  webm: "video.svg",
  avi: "video.svg",
  mkv: "video.svg",

  // audio
  mp3: "audio.svg",
  wav: "audio.svg",
  ogg: "audio.svg",
  flac: "audio.svg",
  aac: "audio.svg",
  amr: "audio.svg",
  wma: "audio.svg",
};

function FilePreview({ file, remove }) {
  const filename = file.name || "unknown";
  const sizeMb = (file.size / 1024 / 1024).toFixed(2);

  const ext = filename.split(".").pop()?.toLowerCase();
  const iconFile = extToIcon[ext] || "file.svg";
  const iconPath = `/icons/${iconFile}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm hover:bg-gray-50 transition"
    >
      {/* Icon + File info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 flex-shrink-0">
          <Image
            src={iconPath}
            alt={ext || "file"}
            width={32}
            height={32}
            className="object-contain"
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-gray-800 truncate">{filename}</div>
          <div className="text-xs text-gray-500">{sizeMb} MB</div>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={remove}
        className="p-1 rounded-full hover:bg-gray-200 transition flex-shrink-0"
      >
        <X className="text-gray-500 w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default FilePreview;
