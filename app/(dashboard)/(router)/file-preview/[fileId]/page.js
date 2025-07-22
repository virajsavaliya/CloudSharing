// page.js (Cleaned Up)
"use client";
import React, { useEffect, useState, useCallback } from 'react';
import FileInfo from './_components/FileInfo';
import FileShareForm from './_components/FileShareForm';
// import LocalShare from './_components/LocalShare'; // <-- REMOVED
import { getAuth } from 'firebase/auth';
import { app } from '../../../../../firebaseConfig';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import Image from 'next/image'
import OnlineUserList from '../../../../_components/OnlineUserList'

function FilePreview({ params }) {
  const db = getFirestore(app);
  const [file, setFile] = useState(null);
  const [windowWidth, setWindowWidth] = useState(null);
  const auth = getAuth(app); 
  const user = auth.currentUser; 

  const getFileInfo = useCallback(async () => {
    try {
      let docRef = doc(db, "uploadedFile", params.fileId);
      let docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        docRef = doc(db, "uploadedFolders", params.fileId);
        docSnap = await getDoc(docRef);
      }

      if (docSnap.exists()) {
        const fileData = { ...docSnap.data(), id: docSnap.id };
        setFile(fileData);
      } else {
        console.log("No such document found!");
        setFile(null);
      }
    } catch (error) {
      console.error("Error fetching document:", error);
      setFile(null);
    }
  }, [db, params.fileId]);



  useEffect(() => {
    if (params?.fileId) {
      getFileInfo();
    }
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [params?.fileId, getFileInfo]);

  const onPasswordSave = async (password) => {
    const docRef = doc(db, file?.files ? "uploadedFolders" : "uploadedFile", params?.fileId);
    await updateDoc(docRef, {
      password: password
    });
    console.log('Password saved:', password);
  };

  const onReceiversAdd = async (emails) => {
    if (!emails || emails.length === 0) return;
    const docRef = doc(db, file?.files ? "uploadedFolders" : "uploadedFile", params?.fileId);
    const currentReceivers = Array.isArray(file?.receivers) ? file.receivers : [];
    const newReceivers = Array.from(new Set([...currentReceivers, ...emails]));
    await updateDoc(docRef, { receivers: newReceivers });
    setFile(prev => ({ ...prev, receivers: newReceivers }));
  };

  if (!file) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Image
          src="/loader.gif"
          alt="Loading..."
          width={350}
          height={350}
          className="w-100 h-100"
        />
      </div>
    );
  }

  return (
    <div className={`px-5 ${windowWidth <= 768 ? 'py-5' : 'py-10'}`}>
      <div className="md:block">
        <nav aria-label="Breadcrumb">{/*... breadcrumb code ...*/}</nav>
      </div>

      <div className="text-center mb-8 mt-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">File Preview & Share</h1>
        <hr className="border-b-2 border-gray-300 w-16 mx-auto" />
      </div>

      {/* File & Share Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 mt-5 gap-8">
        <FileInfo file={file} />
        <div className="flex flex-col gap-5">
          <FileShareForm file={file} onPasswordSave={onPasswordSave} onReceiversAdd={onReceiversAdd} />
          <OnlineUserList file={file} />
          {/* The old LocalShare component has been removed */}
        </div>
      </div>
    </div>
  );
}

export default FilePreview;