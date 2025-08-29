"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../../_utils/FirebaseAuthContext";
import { db } from "../../../../../firebaseConfig";
import { collection, getDocs, query, where, deleteDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from 'react-hot-toast';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getFileIcon } from "../../../../_utils/fileIcons";
import { FiStar, FiClock, FiFolder, FiFile, FiDownload, FiShare2, FiCalendar } from 'react-icons/fi';

function FilesPage({ searchQuery, setSearchQuery }) {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name');
  const [filterType, setFilterType] = useState('all');
  const [favoriteFiles, setFavoriteFiles] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [quickAccessTabs, setQuickAccessTabs] = useState('recent'); // Add this state

  const fetchFiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Use correct collection name - "uploadedFile" not "uploadedFiles"
      const filesRef = collection(db, "uploadedFile");
      const filesQuery = query(
        filesRef,
        where("userEmail", "==", user.email)
      );
      
      const filesSnapshot = await getDocs(filesQuery);
      console.log("Files found:", filesSnapshot.size);

      // Map files data
      const userFiles = filesSnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("File data:", data);
        return {
          id: doc.id,
          ...data,
          type: "file",
          fileName: data.fileName || "Untitled",
          fileSize: data.fileSize || 0,
          fileUrl: data.fileUrl || "",
          createdAt: data.createdAt?.toMillis?.() || Date.now(),
          userEmail: data.userEmail || user.email
        };
      });

      // Fetch folders from correct collection
      const foldersRef = collection(db, "uploadedFolders");
      const foldersQuery = query(
        foldersRef,
        where("userEmail", "==", user.email)
      );
      
      const foldersSnapshot = await getDocs(foldersQuery);
      console.log("Folders found:", foldersSnapshot.size);

      // Map folders data
      const userFolders = foldersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          type: "folder",
          fileName: data.folderName || `Folder ${doc.id}`,
          files: data.files || [],
          createdAt: data.createdAt?.toMillis?.() || Date.now(),
          userEmail: data.userEmail || user.email
        };
      });

      const allFiles = [...userFiles, ...userFolders];
      console.log("Total items:", allFiles.length, "Files:", userFiles.length, "Folders:", userFolders.length);
      setFiles(allFiles);
      
      // Update recent files
      if (allFiles.length > 0) {
        const recentItems = [...allFiles]
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          .slice(0, 5);
        setRecentFiles(recentItems);
      }

    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Error loading files. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh files when component mounts
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Add refresh function
  const handleRefresh = () => {
    fetchFiles();
    toast.success("Files refreshed");
  };

  // ✅ Move file to Recycle Bin
  const removeFile = async (file) => {
    try {
      const collectionName = file.type === "folder" ? "uploadedFolders" : "uploadedFile";

      await setDoc(doc(db, "recycleBin", file.id), {
        ...file,
        deletedAt: serverTimestamp(),
        userEmail: user.email
      });

      await deleteDoc(doc(db, collectionName, file.id));
      setFiles(prevFiles => prevFiles.filter(f => f.id !== file.id));
      toast.success("File moved to recycle bin (will be deleted in 30 days)");
    } catch (error) {
      toast.error("Error moving file to recycle bin");
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

  // Add file to favorites
  const toggleFavorite = (file) => {
    setFavoriteFiles(prev => {
      const isFavorite = prev.some(f => f.id === file.id);
      if (isFavorite) {
        return prev.filter(f => f.id !== file.id);
      }
      return [...prev, file];
    });
  };

  // Get recent files
  useEffect(() => {
    if (files.length > 0) {
      const sorted = [...files].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRecentFiles(sorted.slice(0, 5));
    }
  }, [files]);

  const filteredAndSortedFiles = useCallback(() => {
    let result = [...files];
    
    // Filter by search
    if (searchQuery) {
      result = result.filter(file => 
        file.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(file => file.type === filterType);
    }

    // Sort files
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.fileName?.localeCompare(b.fileName);
        case 'size':
          return (b.fileSize || 0) - (a.fileSize || 0);
        case 'date':
          return (b.createdAt || 0) - (a.createdAt || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [files, searchQuery, filterType, sortBy]);

  // Update the getFormattedDate function
  const getFormattedDate = (timestamp) => {
    if (!timestamp) return 'No date';
    
    // Handle different timestamp formats
    let date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp.seconds) {
      // Handle Firestore timestamp
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Invalid date';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    try {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Add this section after Quick Stats and before the main content
  const QuickAccessSection = () => (
    <div className="mb-8 bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="border-b border-gray-100">
        <div className="flex gap-4 p-4">
          <button
            onClick={() => setQuickAccessTabs('recent')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              quickAccessTabs === 'recent' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FiClock /> Recent
          </button>
          <button
            onClick={() => setQuickAccessTabs('favorites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              quickAccessTabs === 'favorites' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FiStar /> Favorites
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(quickAccessTabs === 'recent' ? recentFiles : favoriteFiles).map(file => (
            <div 
              key={file.id}
              className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="relative">
                <Image 
                  src={getFileIcon(file)} 
                  width={40} 
                  height={40} 
                  alt="" 
                  className="rounded"
                />
                {file.type === 'folder' && (
                  <span className="absolute -top-1 -right-1 text-xs bg-gray-100 px-1 rounded">
                    {file.files?.length || 0}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-gray-900 truncate" title={file.fileName}>
                  {truncateFileName(file.fileName || `Folder ${file.id}`)}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <FiCalendar className="text-gray-400" />
                    {getFormattedDate(file.createdAt || file.timestamp || Date.now())}
                  </span>
                  {file.type !== 'folder' && (
                    <span className="flex items-center gap-1">
                      <FiFile className="text-gray-400" />
                      {(file.fileSize / 1024 / 1024).toFixed(1)} MB
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openFileInNewTab(file)}
                  className="p-1 hover:bg-blue-50 rounded-full text-blue-600"
                  title="Open"
                >
                  <FiDownload size={16} />
                </button>
                <button
                  onClick={() => resendFile(file)}
                  className="p-1 hover:bg-green-50 rounded-full text-green-600"
                  title="Share"
                >
                  <FiShare2 size={16} />
                </button>
                <button
                  onClick={() => toggleFavorite(file)}
                  className={`p-1 hover:bg-yellow-50 rounded-full ${
                    favoriteFiles.some(f => f.id === file.id) 
                      ? 'text-yellow-400' 
                      : 'text-gray-400 hover:text-yellow-400'
                  }`}
                  title="Toggle favorite"
                >
                  <FiStar size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty States */}
        {quickAccessTabs === 'recent' && recentFiles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FiClock className="mx-auto mb-2 text-2xl" />
            <p>No recent files</p>
          </div>
        )}
        {quickAccessTabs === 'favorites' && favoriteFiles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FiStar className="mx-auto mb-2 text-2xl" />
            <p>No favorite files yet</p>
          </div>
        )}
      </div>
    </div>
  );

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

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Add refresh button in header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Files</h1>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Refresh Files
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <FiFile className="text-blue-500 text-xl" />
            <div>
              <h3 className="text-sm font-medium">Total Files</h3>
              <p className="text-2xl font-bold">{files.filter(f => f.type === 'file').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <FiFolder className="text-yellow-500 text-xl" />
            <div>
              <h3 className="text-sm font-medium">Folders</h3>
              <p className="text-2xl font-bold">{files.filter(f => f.type === 'folder').length}</p>
            </div>
          </div>
        </div>
        {/* Add more stats as needed */}
      </div>

      {/* Quick Access */}
      <QuickAccessSection />

      {/* Main Files Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">All Files</h2>
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search Bar */}
            <div className="flex-1 min-w-[300px]">
              <input
                type="search"
                placeholder="Search files..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filter & Sort Controls */}
            <div className="flex gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300"
              >
                <option value="all">All Types</option>
                <option value="file">Files</option>
                <option value="folder">Folders</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300"
              >
                <option value="name">Name</option>
                <option value="size">Size</option>
                <option value="date">Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Files Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedFiles().map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border hover:shadow-md transition-shadow p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Image src={getFileIcon(file)} width={40} height={40} alt="" />
                  <div>
                    <h3 className="text-sm font-medium truncate" title={file.fileName}>
                      {truncateFileName(file.fileName || `Folder ${file.id}`)}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {file.type === "folder" 
                        ? `${file.files?.length || 0} files`
                        : `${(file.fileSize / 1024 / 1024).toFixed(2)} MB`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleFavorite(file)}
                  className={`text-xl ${favoriteFiles.some(f => f.id === file.id) ? 'text-yellow-400' : 'text-gray-400'}`}
                >
                  <FiStar />
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => openFileInNewTab(file)}
                  className="flex-1 text-sm px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Open
                </button>
                <button
                  onClick={() => resendFile(file)}
                  className="flex-1 text-sm px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Share
                </button>
                <button
                  onClick={() => removeFile(file)}
                  className="text-sm px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedFiles().length === 0 && (
          <div className="text-center py-12">
            <Image
              src="/empty-folder.png"
              width={120}
              height={120}
              alt="No files"
              className="mx-auto mb-4"
            />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No files found</h3>
            <p className="text-gray-500">Upload some files to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FilesPage;