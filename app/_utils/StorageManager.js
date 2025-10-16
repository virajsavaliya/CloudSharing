'use client';

import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { STORAGE_PLANS } from './StorageConfig';

const updateStorageViaWebSocket = async (userId, currentUsage, totalStorage) => {
  try {
    await fetch('/api/storage-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, currentUsage, totalStorage })
    });
  } catch (error) {
    console.error('Failed to send storage update via WebSocket:', error);
  }
};

export const StorageManager = {
  calculateUserStorage: async (userEmail, userPlan = 'FREE') => {
    try {
      const filesRef = collection(db, 'uploadedFile');
      const q = query(filesRef, where('userEmail', '==', userEmail));
      const snapshot = await getDocs(q);
      let totalSize = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.isDeleted === true) return;
        
        if (data.fileSize) {
          let size = data.fileSize;
          if (typeof size === 'number') {
            totalSize += size;
            return;
          }
          if (typeof size === 'string') {
            const numericValue = parseFloat(size.replace(/[^\d.]/g, ''));
            if (!isNaN(numericValue)) {
              if (size.toLowerCase().includes('mb')) {
                totalSize += numericValue * 1024 * 1024;
              } else if (size.toLowerCase().includes('kb')) {
                totalSize += numericValue * 1024;
              } else {
                totalSize += numericValue;
              }
            }
          }
        }
      });

      // Send storage update via WebSocket after calculation
      const plan = STORAGE_PLANS[userPlan] || STORAGE_PLANS.FREE;
      await updateStorageViaWebSocket(userEmail, totalSize, plan.maxStorage);

      return totalSize;
    } catch (error) {
      console.error('Storage calculation error:', {
        message: error.message,
        code: error.code,
        userEmail: userEmail,
        stack: error.stack
      });
      return 0;
    }
  },

  canUploadFile: async (userEmail, fileSize, userPlan = 'FREE') => {
    try {
      const currentUsage = await StorageManager.calculateUserStorage(userEmail, userPlan);
      const plan = STORAGE_PLANS[userPlan] || STORAGE_PLANS.FREE;
      const newFileSize = typeof fileSize === 'string' 
        ? parseInt(fileSize.replace(/[^\d]/g, '')) * 1024 * 1024 
        : fileSize;
      return (currentUsage + newFileSize) <= plan.maxStorage;
    } catch (error) {
      console.error('Error checking upload capacity:', error);
      return false;
    }
  }
};
