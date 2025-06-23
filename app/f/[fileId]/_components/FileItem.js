import React, { useState } from "react";
import { Download, Lock } from "lucide-react";
import Image from "next/image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { getFileIcon } from "../../../_utils/fileIcons";

function FileItem({ file }) {
  const [password, setPassword] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);

  const handlePasswordChange = (e) => {
    const enteredPassword = e.target.value;
    setPassword(enteredPassword);
    setIsPasswordCorrect(enteredPassword === file.password);
  };

  const downloadFolderAsZip = async (folder) => {
    if (!folder.files || folder.files.length === 0) {
      alert("No files available to download.");
      return;
    }

    setDownloading(true);
    const zip = new JSZip();

    try {
      let anySuccess = false;
      for (const f of folder.files) {
        try {
          const response = await fetch(f.fileUrl, { mode: "cors" });
          if (!response.ok) throw new Error("Network error");
          const arrayBuffer = await response.arrayBuffer();
          zip.file(f.fileName, arrayBuffer);
          anySuccess = true;
        } catch (error) {
          console.error(`Error fetching file: ${f.fileUrl}`, error);
          alert(`Failed to fetch "${f.fileName}". This is usually a CORS issue.`);
        }
      }

      if (!anySuccess) {
        alert("Failed to fetch any files for ZIP. Please ensure all files are public.");
        setDownloading(false);
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${folder.folderId || "download"}.zip`);
    } catch (error) {
      console.error("Error during ZIP creation:", error);
      alert("Failed to download files. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const groupFilesByType = (files) => {
    const groups = {};
    files?.forEach(f => {
      const type = f.fileType?.split('/')[0] || 'other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(f);
    });
    return groups;
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 flex flex-col items-center p-0 m-0">
      
      {/* Header */}
      <div className="w-full bg-gray-800 py-4 px-6 flex items-center justify-between shadow-md">
        <Image src="/dark.svg" alt="CloudShare Logo" width={150} height={150} />
        <a
          href="https://cloudsharing.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          Try CloudShare Free
        </a>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-lg bg-gray-800 rounded-lg shadow-lg mt-8 mb-6 p-6 flex flex-col items-center">
        
        {/* File Header */}
        <div className="flex flex-col items-center mb-6">
          <Image
            src={file?.files ? '/logo_icon.svg' : getFileIcon(file?.fileType)}
            alt="File Type"
            width={60}
            height={60}
            className="object-contain mb-2"
          />
          <h1 className="text-2xl font-semibold text-white mb-1">
            {file?.files ? 'Shared Folder' : 'Shared File'}
          </h1>
          <p className="text-gray-400 text-sm">
            <span className="font-medium">{file?.userName}</span> shared this with you
          </p>
        </div>

        {/* Password Section */}
        {file.password && (
          <div className="mb-6 w-full">
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="text-gray-300" size={18} />
                <span className="font-semibold text-gray-200 text-sm">Password Protected</span>
              </div>
              <input
                type="password"
                className="w-full p-2 border border-gray-600 rounded-md text-center bg-gray-800 text-white"
                placeholder="Enter password to access"
                value={password}
                onChange={handlePasswordChange}
              />
            </div>
          </div>
        )}

        {/* Content Section */}
        {file?.files ? (
          <div className="space-y-4 w-full">
            {Object.entries(groupFilesByType(file.files)).map(([type, files]) => (
              <div key={type} className="bg-gray-700 p-4 rounded-lg shadow-sm">
                <h3 className="text-base font-medium capitalize mb-2 text-gray-200">{type} Files</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {files.map((f, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 border border-gray-600 rounded-lg bg-gray-800">
                      <Image
                        src={getFileIcon(f.fileType)}
                        alt={f.fileType}
                        width={28}
                        height={28}
                        className="object-contain"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-white">{f.fileName}</p>
                        <p className="text-xs text-gray-400">
                          {(f.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button
              className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold shadow"
              onClick={() => downloadFolderAsZip(file)}
              disabled={downloading || (file.password && !isPasswordCorrect)}
            >
              {downloading ? "Downloading..." : "Download All Files"}
              <Download size={20} />
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="bg-gray-700 rounded-xl p-6 mb-4 w-full flex flex-col items-center shadow">
              <Image
                src={getFileIcon(file?.fileType)}
                alt={file?.fileType}
                width={48}
                height={48}
                className="object-contain mb-2"
              />
              <p className="font-semibold text-lg text-white mb-1 truncate w-full text-center">{file?.fileName}</p>
              <p className="text-sm text-gray-400 mb-2">{file?.fileType}</p>
              <p className="text-xs text-gray-500 mb-2">{(file?.fileSize / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center gap-2 font-semibold shadow"
              onClick={() => window.open(file?.fileUrl)}
              disabled={file?.password && !isPasswordCorrect}
            >
              <Download size={20} />
              Download File
            </button>
          </div>
        )}

        {/* Footer Section */}
        <div className="mt-8 w-full text-center">
          <div className="inline-flex items-center gap-2 bg-gray-700 px-4 py-2 rounded-lg shadow">
            <Image src="/darkicon.svg" alt="CloudShare" width={24} height={24} className="rounded" />
            <span className="font-semibold text-gray-200">CloudShare</span>
            <span className="text-gray-400 text-sm">- Fast, Secure File Sharing</span>
          </div>
          <p className="mt-2 text-gray-400 text-xs">
            Want to share your own files? <a href="https://cloudsharing.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">Try CloudShare for free</a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-xs mt-4 mb-2 w-full">
        &copy; {new Date().getFullYear()} CloudShare. Secure file sharing for everyone.
      </div>
    </div>
  );
}

export default FileItem;
