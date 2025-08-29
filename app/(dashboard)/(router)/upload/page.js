"use client";
import React, { useState, useEffect } from "react";
import GlassUploadPage from "./_components/UploadForm";
import { useAuth } from "../../../_utils/FirebaseAuthContext";
import { useRouter, usePathname } from "next/navigation";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { doc, getFirestore, setDoc, getDoc } from "firebase/firestore";
import { generateRandomString } from "../../../_utils/GenerateRandomString";
import { app } from "../../../../firebaseConfig";
import Image from 'next/image'

function Upload() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("Free");

  const storage = getStorage(app);
  const db = getFirestore(app);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect_url=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!user || !user.uid) return;
      try {
        const userSubDoc = await getDoc(doc(db, "userSubscriptions", user.uid));
        if (userSubDoc.exists()) {
          setCurrentPlan(userSubDoc.data().plan);
        }
      } catch (error) {
        console.error("Error fetching user plan:", error);
      }
    };
    fetchUserPlan();
  }, [user, db]);

  const getFileSizeLimit = () => {
    switch (currentPlan) {
      case "Premium":
        return Infinity;
      case "Pro":
        return 2 * 1024 * 1024 * 1024; // 2GB
      default:
        return 50 * 1024 * 1024; // 50MB
    }
  };

  const uploadFiles = async (files, title, notes, receivers = []) => { // Update function signature
    const sizeLimit = getFileSizeLimit();
    const oversizedFiles = files.filter((file) => file.size > sizeLimit);

    if (oversizedFiles.length > 0) {
      alert(
        `Your ${currentPlan} plan allows a maximum file size of ${sizeLimit / (1024 * 1024)}MB per file. Please upgrade your plan for larger files.`
      );
      return;
    }

    setIsUploading(true);
    setProgress(0);

    if (files.length === 1) {
      const file = files[0];
      const docId = generateRandomString();
      const storageRef = ref(storage, `file-upload/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const newProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(newProgress));
        },
        (error) => {
          console.error("Upload failed:", error);
          setIsUploading(false);
        },
        async () => {
          const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
          await setDoc(doc(db, "uploadedFile", docId), {
            fileName: title || file.name, // Use title or original filename
            title, // Store the title
            notes, // Store the notes
            fileSize: file.size,
            fileType: file.type,
            fileUrl: fileUrl,
            userEmail: user?.email,
            userName: user?.displayName,
            shortUrl: process.env.NEXT_PUBLIC_BASE_URL + docId,
            createdAt: new Date(),
            receivers,
          });

          setIsUploading(false);
          router.push(`/file-preview/${docId}`);
        }
      );
    } else {
      const folderId = generateRandomString();
      const folderRef = `file-upload/${folderId}/`;
      let uploadedFiles = [];
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      let totalBytesTransferred = 0;

      for (const file of files) {
        const storageRef = ref(storage, folderRef + file.name);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
          const unsubscribe = uploadTask.on(
            "state_changed",
            (snapshot) => {
              const fileBytesTransferred = snapshot.bytesTransferred;
              
              const totalProgress = ((totalBytesTransferred + fileBytesTransferred) / totalSize) * 100;
              setProgress(Math.round(totalProgress));
            },
            (error) => {
              console.error("Upload failed:", error);
              unsubscribe();
              reject(error);
            },
            async () => {
              const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
              uploadedFiles.push({
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                fileUrl: fileUrl,
              });
              totalBytesTransferred += file.size;
              unsubscribe();
              resolve();
            }
          );
        });
      }

      await setDoc(doc(db, "uploadedFolders", folderId), {
        folderId,
        title, // Store the title
        notes, // Store the notes
        files: uploadedFiles,
        userEmail: user?.email,
        userName: user?.displayName,
        shortUrl: process.env.NEXT_PUBLIC_BASE_URL + folderId,
        createdAt: new Date(),
        receivers,
      });

      setIsUploading(false);
      router.push(`/file-preview/${folderId}`);
    }
  };

  return (
    <div className="p-5 px-8 md:px-8">
      {user ? (
        <>
          <NavLocation />
          <UploadTitle />
          <h2 className="text-[25px] text-center m-5 md:text-[40px] mb-4 mt-5">
            Start{" "}
            <strong className="text-primary">Uploading</strong> Files and{" "}
            <strong className="text-primary">Share</strong> Them
          </h2>
          <GlassUploadPage
            uploadBtnClick={(files, title, notes) => uploadFiles(files, title, notes)} // Update function call
            isUploading={isUploading}
            progress={progress}
          />
        </>
      ) : (
        <button
          onClick={() =>
            router.push(`/login?redirect_url=${encodeURIComponent(pathname)}`)
          }
        >
        </button>
      )}
    </div>
  );
}
// ✅ Navigation Breadcrumb
const NavLocation = () => {
  return (
    <div className="md:block">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1 text-sm text-gray-600">
          <li>
            <a href="/" className="block transition hover:text-gray-700">
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
            </a>
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
            <a href="/upload" className="block transition hover:text-gray-700">
              Upload
            </a>
          </li>
        </ol>
      </nav>
    </div>
  );
};

// ✅ Upload Page Title
const UploadTitle = () => {
  return (
    <div className="text-center mb-8 mt-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">File Upload</h1>
      <hr className="border-b-2 border-gray-300 w-16 mx-auto mt-2" />
    </div>
  );
};

export default Upload;