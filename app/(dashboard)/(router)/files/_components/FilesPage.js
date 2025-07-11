"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../../_utils/FirebaseAuthContext"; // <-- new context
import { db } from "../../../../../firebaseConfig";
import {
  collection, getDocs, query, where, deleteDoc, doc, setDoc
} from "firebase/firestore";
import Link from "next/link";
import { ToastContainer } from 'react-toastify';
import toast from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image'

function FilesPage() {
  const { user } = useAuth(); // <-- use Firebase Auth context
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    if (!user) return;
    try {
      const filesRef = collection(db, "uploadedFile");
      const filesQuery = query(filesRef, where("userEmail", "==", user?.email));
      const filesSnapshot = await getDocs(filesQuery);

      const foldersRef = collection(db, "uploadedFolders");
      const foldersQuery = query(foldersRef, where("userEmail", "==", user?.email));
      const foldersSnapshot = await getDocs(foldersQuery);

      const userFiles = filesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: "file",
      }));

      const userFolders = foldersSnapshot.docs.map((doc) => ({
        id: doc.id,
        folderId: doc.id,
        ...doc.data(),
        type: "folder",
      }));

      setFiles([...userFiles, ...userFolders]);
      setLoading(false);
    } catch (error) {
      toast.error("Error fetching files", {
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
        },
      });
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // ✅ Move file to Recycle Bin
  const removeFile = async (file) => {
    try {
      const collectionName = file.type === "folder" ? "uploadedFolders" : "uploadedFile";

      await setDoc(doc(db, "recycleBin", file.id), {
        ...file,
        deletedAt: Date.now()
      });

      await deleteDoc(doc(db, collectionName, file.id));

      setFiles((prevFiles) => prevFiles.filter((f) => f.id !== file.id));
      toast.success("File/Folder moved to recycle bin", {
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
        },
      });
    } catch (error) {
      toast.error("Error moving file to recycle bin", {
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
        },
      });
    }
  };

  // ✅ Open file/folder
  const openFileInNewTab = (file) => {
    if (file.type === "folder") {
      window.location.href = `/f/${file.id}`;
    } else if (file.fileUrl) {
      window.open(file.fileUrl, "_blank");
      toast.success("Download started", {
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
        },
      });
    } else {
      toast.error("No URL found for this file.", {
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
        },
      });
    }
  };

  // ✅ Resend File
  const resendFile = (file) => {
    if (!file || typeof file !== "object") {
      toast.error("Invalid file data");
      return;
    }
    const fileId = file?.id || file?.folderId;
    if (!fileId) {
      alert("Error: File ID missing! Check console logs.");
      return;
    }
    window.open(`/file-preview/${fileId}`, '_blank');
  };

  

  // ✅ Shorten Long File Names (Fixes Overlapping)
  const truncateFileName = (name, maxLength = 25) => {
    if (!name) return "Unknown";
    if (name.length > maxLength) {
      const extensionIndex = name.lastIndexOf(".");
      const extension = extensionIndex !== -1 ? name.slice(extensionIndex) : "";
      return name.slice(0, maxLength) + "..." + extension;
    }
    return name;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
      <Image 
        src="/loader.gif" 
        alt="Loading..." 
        width={350}
        height={350}
      />
    </div>
    );
  }


  const NavLocation = () => {
    return (
      <div className="md:block">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-sm text-gray-600">
            <li>
              <Link href="/" className="block transition hover:text-gray-700">
                <span className="sr-only"> Home </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </Link>
            </li>
            <li className="rtl:rotate-180">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li>
              <Link
                href="/upload"
                className="block transition hover:text-gray-700"
              >
                {" "}
                Upload{" "}
              </Link>
            </li>
            <li className="rtl:rotate-180">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li>
              <a
                href="/files"
                className="block transition hover:text-gray-700"
              >
                {" "}
                Files{" "}
              </a>
            </li>
          </ol>
        </nav>
      </div>
    );
  };

  
  const FilesTitle = () => {
    return (
      <div className="text-center mb-8 mt-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Files</h1>
        <hr className="border-b-2 border-gray-300 w-16 mx-auto" />
      </div>
    );
  };

  return (
    <div className="p-5 md:p-8 min-h-screen bg-white">
      <NavLocation />
      <FilesTitle />
      <Tables files={files} openFileInNewTab={openFileInNewTab} resendFile={resendFile} removeFile={removeFile} truncateFileName={truncateFileName} />
      <ToastContainer />
    </div>
  );
}

const Tables = ({ files, openFileInNewTab, resendFile, removeFile, truncateFileName }) => {
  const shortenFileType = (fileType) => {
    const fileTypeMap = {
      "image/jpeg": ".jpeg",
        "image/png": ".png",
        "image/svg+xml": ".svg",
        "image/gif": ".gif",
        "image/heic": ".heic",
        "image/heif": ".heif",
        "image/dng": ".dng",
        "application/pdf": ".pdf",
        "application/zip": ".zip",
        "application/x-rar-compressed": ".rar",
        "application/x-7z-compressed": ".7z",
        "application/x-tar": ".tar",
        "application/x-gzip": ".gz",
        "application/x-zip-compressed": ".zip",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          ".docx",
        "application/msword": ".doc",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
          ".xlsx",
        "application/vnd.ms-excel": ".xls",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation":
          ".pptx",
        "application/vnd.ms-powerpoint": ".ppt",
        "application/msaccess": ".accdb",
        "application/vnd.ms-project": ".mpp",
        "application/vnd.visio": ".vsdx",
        "video/mp4": ".mp4",
        "video/x-msvideo": ".avi",
        "video/x-ms-wmv": ".wmv",
        "video/x-matroska": ".mkv",
        "video/webm": ".webm",
        "video/quicktime": ".mov",
        "video/mpeg": ".mpeg",
        "video/ogg": ".ogv",
        "video/3gpp": ".3gp",
        "video/3gpp2": ".3g2",
        "video/x-flv": ".flv",
        "video/x-m4v": ".m4v",
        "audio/mpeg": ".mp3",
        "audio/wav": ".wav",
        "audio/ogg": ".ogg",
        "audio/flac": ".flac",
        "audio/aac": ".aac",
        "audio/mp4": ".m4a",
        "audio/amr": ".amr",
        "audio/x-ms-wma": ".wma",

    };
    return fileTypeMap[fileType] || fileType;
  };

  return (
    <div className="overflow-x-auto">
      {/* ✅ Desktop View */}
      <div className="hidden md:block">
        <table className="w-full bg-white border border-gray-300 rounded-lg shadow min-w-[600px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 md:p-6 border-b text-center">No.</th>
              <th className="p-3 md:p-6 border-b text-center">File Name</th>
              <th className="p-3 md:p-6 border-b text-center">File Size</th>
              <th className="p-3 md:p-6 border-b text-center">File Type</th>
              <th className="p-3 md:p-6 border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.length > 0 ? (
              files.map((file, index) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="p-3 md:p-6 border-b text-center">{index + 1}</td>
                  <td className="p-3 md:p-6 border-b text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]" title={file.fileName}>
                    {truncateFileName(file.fileName || `Folder ${file.id}`)}
                  </td>
                  <td className="p-3 md:p-6 border-b text-center">
                    {file.type === "folder"
                      ? `${file.files?.length || 0} files`
                      : `${(file.fileSize / 1024 / 1024).toFixed(2)} MB`}
                  </td>
                  <td className="p-3 md:p-6 border-b text-center">
                    {file.type === "folder" ? "Folder" : shortenFileType(file.fileType)}
                  </td>
                  <td className="p-3 md:p-6 border-b text-center">
                    <div className="flex justify-center space-x-2">
                      <button onClick={() => openFileInNewTab(file)} className="bg-blue-500 text-white px-3 py-1 rounded-md">Open</button>
                      <button onClick={() => resendFile(file)} className="bg-green-500 text-white px-3 py-1 rounded-md">Resend</button>
                      <button onClick={() => removeFile(file)} className="bg-red-500 text-white px-3 py-1 rounded-md">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-3 md:p-6 border-b text-center">No files found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Mobile View */}
      <div className="block md:hidden">
        {files.length > 0 ? (
          files.map((file, index) => (
            <div key={file.id} className="border border-gray-300 rounded-lg p-4 mb-4 shadow">
              <div className="mb-2">
                <p className="font-semibold">File Name:</p>
                <p className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]" title={file.fileName}>
                  {truncateFileName(file.fileName || `Folder ${file.id}`)}
                </p>
              </div>
              <div className="flex justify-between mb-2">
                <div>
                  <p className="font-semibold">File Size:</p>
                  <p>
                    {file.type === "folder"
                      ? `${file.files?.length || 0} files`
                      : `${(file.fileSize / 1024 / 1024).toFixed(2)} MB`}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">File Type:</p>
                  <p>{file.type === "folder" ? "Folder" : shortenFileType(file.fileType)}</p>
                </div>
                
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="flex space-x-2">
                  <button onClick={() => openFileInNewTab(file)} className="bg-blue-500 text-white px-3 py-1 rounded-md">Open</button>
                  <button onClick={() => resendFile(file)} className="bg-green-500 text-white px-3 py-1 rounded-md">Resend</button>
                  <button onClick={() => removeFile(file)} className="bg-red-500 text-white px-3 py-1 rounded-md">Delete</button>
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center">No files found</p>
        )}
      </div>
    </div>
  );
};

export default FilesPage;