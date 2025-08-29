import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";

function FileInfo({ file }) {
  const [fileType, setFileType] = useState("Unknown");

  useEffect(() => {
    if (file?.fileType) {
      setFileType(file.fileType.split("/")[0]);
    }
  }, [file]);

  const handleDownload = () => {
    if (file?.shortUrl) {
      window.open(file.shortUrl, "_blank"); // opens download in new tab
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center p-8 rounded-2xl bg-blue-0/30 backdrop-blur-xl border border-blue-0 shadow-xl"
    >
      {/* File Info */}
      <h2 className="text-2xl font-bold text-blue-900 text-center break-words mb-3">
        {file.fileName || file.name || "Untitled"}
      </h2>
      <p className="text-blue-700/70 mb-6">
        {fileType} •{" "}
        {file.fileSize
          ? (file.fileSize / (1024 * 1024)).toFixed(2) + " MB"
          : `${file.files?.length || 0} items`}
      </p>

      {/* QR Code */}
      {file.shortUrl && (
        <div className="bg-white/60 p-4 rounded-xl shadow-inner border border-blue-200/40 mb-6">
          <QRCodeSVG value={file.shortUrl} size={160} level="H" />
        </div>
      )}

      {/* Download Button */}
      {file.shortUrl && (
        <button
          onClick={handleDownload}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-400 text-white font-medium shadow-md hover:from-blue-600 hover:to-blue-500 transition flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download
        </button>
      )}
    </motion.div>
  );
}

export default FileInfo;
