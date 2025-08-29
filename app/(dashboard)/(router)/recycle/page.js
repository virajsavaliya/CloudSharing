"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from "../../../_utils/FirebaseAuthContext";
import { db } from "../../../../firebaseConfig";
import { collection, getDocs, query, where, deleteDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { FiTrash2, FiRefreshCw, FiSearch, FiFilter, FiClock } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { getFileIcon } from '../../../_utils/fileIcons';

export default function RecycleBin() {
  const { user } = useAuth();
  const [deletedItems, setDeletedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortBy, setSortBy] = useState('date');

  // Add cleanup function
  const cleanupRecycleBin = useCallback(async () => {
    if (!user) return;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30); // 30 days ago

      const recycleBinRef = collection(db, "recycleBin");
      const q = query(
        recycleBinRef,
        where("userEmail", "==", user.email),
        where("deletedAt", "<=", thirtyDaysAgo)
      );

      const snapshot = await getDocs(q);
      const deletePromises = [];

      snapshot.forEach((doc) => {
        console.log(`Deleting item ${doc.id}`);
        deletePromises.push(deleteDoc(doc.ref));
      });

      await Promise.all(deletePromises);
      console.log(`Cleaned up ${deletePromises.length} items`);

      // Update UI
      setDeletedItems(prev => 
        prev.filter(item => {
          const itemDate = new Date(item.deletedAt);
          return itemDate > thirtyDaysAgo;
        })
      );
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }, [user]);

  // Fetch deleted items
  const fetchDeletedItems = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const recycleBinRef = collection(db, "recycleBin");
      const q = query(
        recycleBinRef, 
        where("userEmail", "==", user.email)
      );
      
      const querySnapshot = await getDocs(q);
      
      const items = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const deletedAt = data.deletedAt?.toMillis?.() || data.deletedAt || Date.now();
        const daysRemaining = Math.max(
          0,
          Math.ceil((deletedAt + (30 * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000))
        );
        
        return {
          id: doc.id,
          ...data,
          deletedAt,
          daysRemaining
        };
      });

      setDeletedItems(items.sort((a, b) => b.deletedAt - a.deletedAt));
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to fetch deleted items");
    } finally {
      setLoading(false);
    }
  };

  // Add cleanup effect
  useEffect(() => {
    fetchDeletedItems();
    cleanupRecycleBin();
    
    // Run cleanup every 8 hours (3 times per day)
    const cleanupInterval = setInterval(() => {
      cleanupRecycleBin();
      fetchDeletedItems();
    }, 8 * 60 * 60 * 1000); // 8 hours in milliseconds
    
    return () => clearInterval(cleanupInterval);
  }, [cleanupRecycleBin]);

  const restoreItem = async (item) => {
    try {
      const collectionName = item.type === "folder" ? "uploadedFolders" : "uploadedFile";
      
      // Remove deletedAt field before restoring
      const { deletedAt, ...restoreData } = item;
      
      await setDoc(doc(db, collectionName, item.id), restoreData);
      await deleteDoc(doc(db, "recycleBin", item.id));
      
      setDeletedItems(prev => prev.filter(i => i.id !== item.id));
      toast.success("Item restored successfully");
    } catch (error) {
      toast.error("Failed to restore item");
    }
  };

  const permanentlyDelete = async (item) => {
    try {
      await deleteDoc(doc(db, "recycleBin", item.id));
      setDeletedItems(prev => prev.filter(i => i.id !== item.id));
      toast.success("Item permanently deleted");
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const filteredItems = deletedItems.filter(item => 
    item.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.fileName?.localeCompare(b.fileName);
      case 'date':
        return b.deletedAt - a.deletedAt;
      case 'size':
        return (b.fileSize || 0) - (a.fileSize || 0);
      default:
        return 0;
    }
  });

  // Update the remaining time calculation
  const getRemainingTime = (deletedAt) => {
    const deleteTime = new Date(deletedAt).getTime();
    const expiryTime = deleteTime + (5 * 60 * 1000); // 5 minutes in milliseconds
    const remainingMs = expiryTime - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 1000 / 60)); // Return remaining minutes
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Title and Breadcrumbs */}
      <div className="mb-6">
    
        <h1 className="text-2xl font-bold text-gray-900">Recycle Bin</h1>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search deleted items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="date">Date Deleted</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>
          </div>
          
          <div className="flex gap-3">
            {selectedItems.length > 0 && (
              <button
                onClick={() => {
                  selectedItems.forEach(id => {
                    const item = deletedItems.find(i => i.id === id);
                    if (item) restoreItem(item);
                  });
                  setSelectedItems([]);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <FiRefreshCw /> Restore Selected
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={(e) => {
                  setSelectedItems(prev => 
                    e.target.checked 
                      ? [...prev, item.id]
                      : prev.filter(id => id !== item.id)
                  );
                }}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Image src={getFileIcon(item)} width={40} height={40} alt="" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate" title={item.fileName}>
                  {item.fileName || `Unnamed ${item.type}`}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Deleted: {new Date(item.deletedAt).toLocaleDateString()}</span>
                  <span className="text-orange-500">
                    {item.daysRemaining} days remaining
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => restoreItem(item)}
                className="flex-1 text-xs px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Restore
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Permanently delete this item?')) {
                    permanentlyDelete(item);
                  }
                }}
                className="flex-1 text-xs px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <FiTrash2 className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Recycle Bin is Empty
          </h3>
          <p className="text-gray-500">
            Items you delete will appear here for 30 days
          </p>
        </div>
      )}
    </div>
  );
}
