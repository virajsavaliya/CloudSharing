"use client";
import React, { useEffect, useState, useCallback } from "react";
import FileInfo from "./_components/FileInfo";
import FileShareForm from "./_components/FileShareForm";
import { getAuth } from "firebase/auth";
import { app } from "../../../../../firebaseConfig";
import { doc, getDoc, getFirestore, updateDoc } from "firebase/firestore";
import Image from "next/image";
import OnlineUserList from "../../../../_components/OnlineUserList";
import { motion } from "framer-motion";

function FilePreview({ params }) {
  const db = getFirestore(app);
  const [file, setFile] = useState(null);

  const getFileInfo = useCallback(async () => {
    try {
      let docRef = doc(db, "uploadedFile", params.fileId);
      let docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        docRef = doc(db, "uploadedFolders", params.fileId);
        docSnap = await getDoc(docRef);
      }

      if (docSnap.exists()) {
        setFile({ ...docSnap.data(), id: docSnap.id });
      } else {
        setFile(null);
      }
    } catch (error) {
      console.error("Error fetching document:", error);
      setFile(null);
    }
  }, [db, params.fileId]);

  useEffect(() => {
    if (params?.fileId) getFileInfo();
  }, [params?.fileId, getFileInfo]);

  const onPasswordSave = async (password) => {
    const docRef = doc(db, file?.files ? "uploadedFolders" : "uploadedFile", params?.fileId);
    await updateDoc(docRef, { password });
  };

  const onReceiversAdd = async (emails) => {
    if (!emails?.length) return;
    const docRef = doc(db, file?.files ? "uploadedFolders" : "uploadedFile", params?.fileId);
    const currentReceivers = Array.isArray(file?.receivers) ? file.receivers : [];
    const newReceivers = Array.from(new Set([...currentReceivers, ...emails]));
    await updateDoc(docRef, { receivers: newReceivers });
    setFile((prev) => ({ ...prev, receivers: newReceivers }));
  };

  if (!file) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
        <Image src="/loader.gif" alt="Loading..." width={200} height={200} unoptimized />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gradient-to-br from-gray-50 via-white to-gray-200">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-extrabold text-gray-800">File Preview & Share</h1>

        <hr className="border-b-2 border-gray-300 w-40 mx-auto mt-2" />
      </motion.div>

      {/* Glassy Card Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* File Info */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="col-span-1"
        >
          <FileInfo file={file} />
        </motion.div>

        {/* Share + Users */}
        <div className="col-span-2 flex flex-col gap-6">
          <FileShareForm file={file} onPasswordSave={onPasswordSave} onReceiversAdd={onReceiversAdd} />

          {/* Active Users Section with Modern Design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-3xl bg-gradient-to-br from-white via-blue-50/30 to-white backdrop-blur-xl p-8 shadow-2xl border-2 border-blue-100/50 hover:border-blue-200/80 transition-all"
          >
            {/* Header with Icon */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#007dfc] to-blue-500 rounded-2xl blur-lg opacity-50"></div>
                  <div className="relative p-3 bg-gradient-to-br from-[#007dfc] to-blue-500 rounded-2xl shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Active Users</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Share files instantly with nearby users</p>
                </div>
              </div>
            </div>
            
            <OnlineUserList file={file} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default FilePreview;
