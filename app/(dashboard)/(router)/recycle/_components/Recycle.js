"use client";
import React, { useEffect, useState, useCallback } from "react";
import { getAuth } from "firebase/auth";
import { db, storage, fileEvents } from "../../../../../firebaseConfig";
import {
  collection, getDocs, query, where, deleteDoc, doc, setDoc, getDoc, Timestamp 
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Image from 'next/image'

function Recycle() {
  // Use Firebase Auth for user
  const user = getAuth().currentUser;
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    if (!user) return;
    try {
      const recycleBinRef = collection(db, "recycleBin");
      const q = query(
        recycleBinRef,
        where("userEmail", "==", user?.email)
      );
      const querySnapshot = await getDocs(q);
  
      const userFiles = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("🔍 Debug File Data:", data); // ✅ Debugging
  
        return {
          id: doc.id,
          ...data,
          type: data.files ? "folder" : "file", // ✅ Detect if it’s a folder or a file
        };
      });
  
      setFiles(userFiles);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching files:", error);
      setLoading(false);
    }
  }, [user]);
  
  

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    const handleFileDeleted = () => {
        fetchFiles();
    };

    fileEvents.addEventListener('fileDeleted', handleFileDeleted);

    return () => {
        fileEvents.removeEventListener('fileDeleted', handleFileDeleted);
    };
  }, [fetchFiles]);

  const recoverFile = async (file) => {
    try {
      const destinationCollection = file.type === "folder" ? "uploadedFolders" : "uploadedFile";
      
      // Remove fields specific to recycle bin
      const fileData = { ...file };
      delete fileData.id;
      delete fileData.deletedAt;
      delete fileData.originalLocation;
      
      // Restore to original location
      await setDoc(doc(db, destinationCollection, file.id), fileData);
      
      // Remove from recycle bin
      await deleteDoc(doc(db, "recycleBin", file.id));
      
      // Update UI
      setFiles(prevFiles => prevFiles.filter(f => f.id !== file.id));
      toast.success("File recovered successfully", {
        style: {
          background: '#363636',
          color: '#fff',
        },
        duration: 3000,
      });
    } catch (error) {
      console.error("Error recovering file:", error);
      toast.error("Error recovering file", {
        style: {
          background: '#363636',
          color: '#fff',
        },
        duration: 3000,
      });
    }
  };

  const showConfirmDialog = () => {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 z-50 flex items-center justify-center';
      dialog.innerHTML = `
        <div class="fixed inset-0 bg-black/50"></div>
        <div class="relative bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
          <h3 class="text-lg font-semibold mb-4">Confirm Deletion</h3>
          <p class="text-gray-600 mb-6">Are you sure you want to permanently delete this file?</p>
          <div class="flex justify-end gap-3">
            <button class="px-4 py-2 text-gray-500 hover:text-gray-700" id="cancelBtn">Cancel</button>
            <button class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" id="confirmBtn">Delete</button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      const confirmBtn = dialog.querySelector('#confirmBtn');
      const cancelBtn = dialog.querySelector('#cancelBtn');
      
      confirmBtn.onclick = () => {
        document.body.removeChild(dialog);
        resolve(true);
      };
      
      cancelBtn.onclick = () => {
        document.body.removeChild(dialog);
        resolve(false);
      };
    });
  };

  const deleteFile = async (fileId) => {
    try {
      const isConfirmed = await showConfirmDialog();
      if (!isConfirmed) return;

      const fileRef = doc(db, "recycleBin", fileId);
      const fileSnap = await getDoc(fileRef);
      
      if (fileSnap.exists()) {
        const data = fileSnap.data();
        if (data.fileUrl) {
          const storageRef = ref(storage, data.fileUrl);
          await deleteObject(storageRef).catch(() => {});
        }
        await deleteDoc(fileRef);
        setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
        toast.success("File deleted permanently", {
          style: {
            background: '#363636',
            color: '#fff',
          },
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Error deleting file", {
        style: {
          background: '#363636',
          color: '#fff',
        },
        duration: 3000,
      });
    }
};

  const showConfirmEmptyDialog = () => {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 z-50 flex items-center justify-center';
      dialog.innerHTML = `
        <div class="fixed inset-0 bg-black/50"></div>
        <div class="relative bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
          <h3 class="text-lg font-semibold mb-4">Empty Recycle Bin</h3>
          <p class="text-gray-600 mb-6">Are you sure you want to permanently delete all files? This action cannot be undone.</p>
          <div class="flex justify-end gap-3">
            <button class="px-4 py-2 text-gray-500 hover:text-gray-700" id="cancelBtn">Cancel</button>
            <button class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" id="confirmBtn">Delete All</button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      const confirmBtn = dialog.querySelector('#confirmBtn');
      const cancelBtn = dialog.querySelector('#cancelBtn');
      
      confirmBtn.onclick = () => {
        document.body.removeChild(dialog);
        resolve(true);
      };
      
      cancelBtn.onclick = () => {
        document.body.removeChild(dialog);
        resolve(false);
      };
    });
  };

  const emptyBin = async () => {
    try {
      const isConfirmed = await showConfirmEmptyDialog();
      if (!isConfirmed) return;

      const recycleBinRef = collection(db, "recycleBin");
      const q = query(recycleBinRef, 
        where("userEmail", "==", user?.email)
      );
      const querySnapshot = await getDocs(q);

      // Delete all files
      await Promise.all(querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          if (data.fileUrl) {
              const storageRef = ref(storage, data.fileUrl);
              await deleteObject(storageRef).catch(() => {});
          }
          await deleteDoc(doc.ref);
      }));

      setFiles([]);
      toast.success("Recycle bin emptied", {
        style: {
          background: '#363636',
          color: '#fff',
        },
        duration: 3000,
      });
    } catch (error) {
      console.error("Error emptying bin:", error);
      toast.error("Error emptying recycle bin", {
        style: {
          background: '#363636',
          color: '#fff',
        },
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
            <Image 
              src="/loader.gif" 
              alt="Loading..." 
              width={350}
              height={350}
              className="w-100 h-100"
              unoptimized
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
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a 1 1 0 010 1.414l-4 4a 1 1 0 01-1.414 0z"
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
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a 1 1 0 010 1.414l-4 4a 1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li>
              <a
                href="/recycle"
                className="block transition hover:text-gray-700"
              >
                {" "}
                Recycle{" "}
              </a>
            </li>
          </ol>
        </nav>
      </div>
    );
  };

  const truncateFileName = (name, maxLength = 25) => {
    if (!name) return "Unknown"; 
    if (name.length > maxLength) {
      const extensionIndex = name.lastIndexOf(".");
      const extension = extensionIndex !== -1 ? name.slice(extensionIndex) : "";
      return name.slice(0, maxLength) + "..." + extension;
    }
    return name;
  };
  

  const RecycleBinTitle = () => {
    return (
      <div className="text-center mb-8 mt-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Recycle Bin</h1>
        <hr className="border-b-2 border-gray-300 w-16 mx-auto mt-2" />
      </div>
    );
  };

  const Tables = () => {
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
        <div className="hidden md:block">
          <table className="w-full bg-white border border-gray-300 rounded-lg shadow min-w-[600px]">
            <thead>
              <tr>
                <th className="p-3 md:p-6 bg-gray-100 border-b text-center">
                  No.
                </th>
                <th className="p-3 md:p-6 bg-gray-100 border-b text-center">
                  File Name
                </th>
                <th className="p-3 md:p-6 bg-gray-100 border-b text-center">
                  File Size
                </th>
                <th className="p-3 md:p-6 bg-gray-100 border-b text-center">
                  File Type
                </th>
                <th className="p-3 md:p-6 bg-gray-100 border-b text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
  {files.length > 0 ? (
    files.map((file, index) => (
      <tr key={file.id} className="hover:bg-gray-50">
        <td className="p-3 md:p-6 border-b text-center">{index + 1}</td>
        <td className="p-3 md:p-6 border-b text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
          {file.fileName || `Folder ${file.id}`}
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
          <div className="flex justify-center">
            <button
              onClick={() => recoverFile(file)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded mr-4"
            >
              Recover
            </button>
            <button
              onClick={() => deleteFile(file.id)}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
            >
              Delete
            </button>
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

        <div className="block md:hidden">
  {files.length > 0 ? (
    files.map((file, index) => (
      <div
        key={file.id}
        className="border border-gray-300 rounded-lg p-4 mb-4 shadow"
      >
        <div className="flex justify-between items-center mb-2">
          
          
        </div>
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
        <span className="flex space-x-2">
          <button
              onClick={() => recoverFile(file)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
            >
              Recover
            </button>
            <button
              onClick={() => deleteFile(file.id)}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
            >
              Delete
            </button>
          </span>
      </div>
      
    ))
  ) : (
    <p className="text-center">No files found</p>
  )}
</div>

      </div>
    );
  };

  return (
    <div className="p-5 px-8 md:px-8">
      <NavLocation />
      <RecycleBinTitle />
      <div className="flex justify-end mb-4">
        <button
          onClick={emptyBin}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
        >
          Empty Bin
        </button>
      </div>
      <Tables />
    </div>
  );
}

export default Recycle;
