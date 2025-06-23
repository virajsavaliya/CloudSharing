import React, { useState, useRef } from "react";
import AlertMsg from "./AlertMsg";
import FilePreview from "./FilePreview";
import ProgressBar from "./ProgressBar";
import { motion } from "framer-motion";

function UploadForm({ uploadBtnClick, isUploading, progress }) {
  const [files, setFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef();

  const allowedFileTypes = [
    "image/svg+xml",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/heic",
    "image/heif",
    "image/dng",
    "application/pdf",
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/x-tar",
    "application/x-gzip",
    "application/x-zip-compressed",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
    "application/msaccess",
    "application/vnd.ms-project",
    "application/vnd.visio",
    "video/mp4",
    "video/x-msvideo",
    "video/x-ms-wmv",
    "video/x-matroska",
    "video/webm",
    "video/quicktime",
    "video/mpeg",
    "video/ogg",
    "video/3gpp",
    "video/3gpp2",
    "video/x-flv",
    "video/x-m4v",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/flac",
    "audio/aac",
    "audio/mp4",
    "audio/amr",
    "audio/x-ms-wma",
  ];

  const onFileSelect = (selectedFiles) => {
    const validFiles = [...selectedFiles].filter(
      (file) => allowedFileTypes.includes(file.type) && file.size <= 52428800
    );

    if (validFiles.length === 0) {
      setErrorMsg("Invalid files! Ensure they are supported and under 50MB.");
      return;
    }

    setErrorMsg(null);
    setFiles(validFiles);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center w-full space-y-4 md:space-y-0 md:space-x-4">
      <motion.label
        htmlFor="dropzone-file"
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex flex-col items-center justify-center w-full md:w-1/2 h-64 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-gray-100 transition duration-300"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          <svg
            className="w-12 h-12 mb-4 text-blue-500"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 16"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
            />
          </svg>
          <p className="mb-2 text-lg md:text-2xl text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span> or{" "}
            <strong className="text-primary">drag & drop</strong>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Supported: PNG, JPG, GIF, PDF, ZIP, MP4, WAV (Max: 50MB)
          </p>
        </div>
        <input
          id="dropzone-file"
          type="file"
          className="hidden"
          ref={fileInputRef}
          accept={allowedFileTypes.join(",")}
          multiple
          onChange={(event) => onFileSelect(event.target.files)}
          disabled={isUploading}
        />
      </motion.label>

      <div className="w-full md:w-1/2 flex flex-col items-center border border-gray-300 rounded-lg p-4 bg-white shadow-md h-64">
        <h2 className="text-xl font-semibold mb-1 text-center">Preview</h2>
        <hr className="border-b-2 border-gray-300 w-16 mx-auto mb-4" />
        {errorMsg && <AlertMsg msg={errorMsg} />}

        {files.length > 0 ? (
          <>
            <div className="max-h-32 overflow-y-auto w-full px-2">
              {files.map((file, index) => (
                <FilePreview key={index} file={file} removeFile={() => removeFile(index)} />
              ))}
            </div>
            {!isUploading && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="p-2 bg-primary text-white w-full rounded-full mt-5"
                onClick={() => uploadBtnClick(files)}
                disabled={isUploading}
              >
                Upload Files
              </motion.button>
            )}
            {isUploading && <ProgressBar progress={progress} />}
          </>
        ) : (
          <p className="text-gray-500 text-center">No files selected</p>
        )}
      </div>
    </div>
  );
}

export default UploadForm;
