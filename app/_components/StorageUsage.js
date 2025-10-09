import React, { useEffect, useState, useCallback } from 'react';
import { StorageManager } from '../_utils/StorageManager';
import { STORAGE_PLANS, formatBytes } from '../_utils/StorageConfig';
import { useStorageUsageSocket } from './StorageUsageWebSocket';

const StorageUsage = ({ userId, userPlan = 'Free' }) => {
    // Normalize plan name to handle case variations
    const normalizedPlan = userPlan.charAt(0).toUpperCase() + userPlan.slice(1).toLowerCase();
    const [storageInfo, setStorageInfo] = useState({
        used: 0,
        total: 0,
        percentage: 0
    });

    const updateStorageInfo = useCallback(({ currentUsage, totalStorage }) => {
        const usagePercentage = (currentUsage / totalStorage) * 100;
        setStorageInfo({
            used: currentUsage,
            total: totalStorage,
            percentage: Math.min(usagePercentage, 100)
        });
    }, []);

    // Initial fetch and WebSocket subscription
    useEffect(() => {
        let isMounted = true;

        const fetchInitialStorageInfo = async () => {
            if (!userId) return;

            try {
                const usedStorage = await StorageManager.calculateUserStorage(userId);
                const planInfo = STORAGE_PLANS[normalizedPlan] || STORAGE_PLANS[userPlan] || STORAGE_PLANS.Free;
                const totalStorage = planInfo.maxStorage;
                
                if (isMounted) {
                    updateStorageInfo({ currentUsage: usedStorage, totalStorage });
                }
            } catch (error) {
                console.error('Error fetching initial storage info:', error);
            }
        };

        fetchInitialStorageInfo();

        // Cleanup
        return () => {
            isMounted = false;
        };
    }, [userId, userPlan, updateStorageInfo]);

    // WebSocket connection for real-time updates
    useStorageUsageSocket({ onStorageUpdate: updateStorageInfo });

    // Color based on usage percentage
    const getProgressColor = (percentage) => {
        if (percentage > 90) return 'bg-red-500';
        if (percentage > 70) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="mb-2 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Storage Usage</h3>
                <span className="text-sm text-gray-500">{normalizedPlan} Plan</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
                <div
                    className={'h-full rounded-full ' + getProgressColor(storageInfo.percentage)}
                    style={{ width: storageInfo.percentage + '%' }}
                />
            </div>

            {/* Storage details */}
            <div className="flex justify-between text-sm">
                <span>{formatBytes(storageInfo.used)} used</span>
                <span className="text-gray-500">
                    {formatBytes(storageInfo.total)} total
                </span>
            </div>

            {/* Usage percentage */}
            <div className="mt-2 text-center text-sm text-gray-600">
                {storageInfo.percentage.toFixed(1)}% used
            </div>
        </div>
    );
};

export default StorageUsage;