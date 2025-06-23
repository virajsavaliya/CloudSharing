"use client";
import React, { useEffect, useState, useCallback } from "react";
import { app } from "../../../firebaseConfig";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import FileItem from "./_components/FileItem";
import Image from 'next/image'

function Fileview({ params }) {
  const db = getFirestore(app);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getFileInfo = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let docRef = doc(db, "uploadedFile", params.fileId);
      let docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // 🔍 If not found in `uploadedFile`, check `uploadedFolders`
        docRef = doc(db, "uploadedFolders", params.fileId);
        docSnap = await getDoc(docRef);
      }

      if (docSnap.exists()) {
        console.log("📂 File/Folders Data:", docSnap.data());
        setFile(docSnap.data());
      } else {
        setError("❌ File not found or invalid link!");
      }
    } catch (error) {
      console.error("Error fetching file:", error);
      setError("⚠️ Error loading file. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [db, params.fileId]);

  useEffect(() => {
    if (params?.fileId) {
      getFileInfo();
    }
  }, [params?.fileId, getFileInfo]);

  return (
    <div className="min-h-screen bg-gray-50">
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <Image src="/loader.gif" alt="Loading..." width={350} height={350} className="w-100 h-100" />
        </div>
      ) : error ? (
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-red-500 text-lg">{error}</p>
        </div>
      ) : (
        <div className="">
          <div className="">
            <FileItem file={file} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Fileview;
