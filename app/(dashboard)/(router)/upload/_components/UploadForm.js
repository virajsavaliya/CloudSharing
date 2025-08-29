// UploadForm.js
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { CloudUpload } from "lucide-react";

import AlertMsg from "./AlertMsg";
import FilePreview from "./FilePreview";
import ProgressBar from "./ProgressBar";

export default function UploadForm({ uploadBtnClick, isUploading, progress }) {
  const [files, setFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const allowedFileTypes = [
    "image/svg+xml","image/png","image/jpeg","image/gif","image/heic","image/heif","image/dng",
    "application/pdf","application/zip","application/x-rar-compressed","application/x-7z-compressed",
    "application/x-tar","application/x-gzip","application/x-zip-compressed",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation","application/vnd.ms-powerpoint",
    "application/msaccess","application/vnd.ms-project","application/vnd.visio",
    "video/mp4","video/x-msvideo","video/x-ms-wmv","video/x-matroska","video/webm","video/quicktime","video/mpeg","video/ogg","video/flac",
    "audio/mpeg","audio/wav","audio/ogg","audio/flac","audio/aac","audio/mp4","audio/amr","audio/x-ms-wma"
  ];

  const onFiles = (selected) => {
    const arr = Array.from(selected);
    const valid = arr.filter((f) => allowedFileTypes.includes(f.type) && f.size <= 52428800);
    if (valid.length === 0) {
      setErrorMsg("No valid files selected — supported types under 50MB.");
      return;
    }
    setErrorMsg(null);
    setFiles(valid);
  };

  const removeFile = (index) => setFiles((s) => s.filter((_, i) => i !== index));

  const startUpload = () => {
    if (files.length === 0) {
      setErrorMsg("Please choose files before uploading.");
      return;
    }
    setErrorMsg(null);
    uploadBtnClick(files, title, notes);
  };

  const onDropLocal = (e) => {
    e.preventDefault();
    setDragOver(false);
    onFiles(e.dataTransfer.files);
  };

  useEffect(() => {
    const handler = (e) => e.preventDefault();
    window.addEventListener("dragover", handler);
    window.addEventListener("drop", handler);
    return () => {
      window.removeEventListener("dragover", handler);
      window.removeEventListener("drop", handler);
    };
  }, []);

  return (
    <div className="flex items-center justify-center p-6">
      <section className="w-full max-w-5xl bg-white border border-gray-200 rounded-3xl p-6 md:p-10 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left side */}
          <div className="flex flex-col gap-6">
            {/* Upload Box or Progress */}
            {isUploading ? (
              <ProgressBar progress={progress} />
            ) : (
              <motion.label
                onDrop={onDropLocal}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                htmlFor="files"
                whileHover={{ scale: 1.01 }}
                className={`rounded-2xl p-8 border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-all ${
                  dragOver ? "ring-2 ring-blue-300/50" : ""
                }`}
              >
                <CloudUpload className="text-gray-500 mb-3" size={48} />
                <p className="text-gray-700 font-medium">Add files</p>
                <p className="text-xs text-gray-500 mt-1">Drop or click to browse</p>
                <input
                  id="files"
                  type="file"
                  multiple
                  ref={inputRef}
                  className="hidden"
                  onChange={(e) => onFiles(e.target.files)}
                />
              </motion.label>
            )}

            {/* File Preview List */}
            <div className="flex-1 overflow-auto space-y-3">
              {files.length === 0 ? (
                <div className="text-center text-gray-500 text-sm">No files selected</div>
              ) : (
                files.map((file, idx) => (
                  <FilePreview key={idx} file={file} remove={() => removeFile(idx)} />
                ))
              )}
            </div>

            {errorMsg && (
              <div className="mt-2">
                <AlertMsg msg={errorMsg} />
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex flex-col gap-6">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                placeholder="e.g., Project Files Q3 2024"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                rows="4"
                placeholder="Add some notes for the recipients."
              ></textarea>
            </label>

            <div className="mt-auto">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={startUpload}
                disabled={isUploading}
                className="w-full py-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-md hover:opacity-95 transition disabled:opacity-60"
              >
                {isUploading ? "Uploading..." : "Send now"}
              </motion.button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
