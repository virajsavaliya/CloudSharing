"use client";

import { useEffect } from 'react';
import * as Ably from 'ably';
import { useAuth } from '../_utils/FirebaseAuthContext';

export function useStorageUsageSocket({ onStorageUpdate }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const ably = new Ably.Realtime({ authUrl: `/api/ably-token?clientId=${user.uid}` });
    const channel = ably.channels.get(`storage-${user.uid}`);

    // Subscribe to storage updates
    channel.subscribe('storage-update', (message) => {
      const { currentUsage, totalStorage } = message.data;
      onStorageUpdate({ currentUsage, totalStorage });
    });

    return () => {
      channel.unsubscribe();
      ably.close();
    };
  }, [user, onStorageUpdate]);
}