"use client";

import { useEffect } from 'react';
import * as Ably from 'ably';
import { useAuth } from '../_utils/FirebaseAuthContext';

export function useStorageUsageSocket({ onStorageUpdate }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let ably = null;
    let channel = null;

    const initializeConnection = async () => {
      try {
        ably = new Ably.Realtime({ authUrl: `/api/ably-token?clientId=${user.uid}` });
        channel = ably.channels.get(`storage-${user.uid}`);

        // Wait for connection to be established
        await new Promise((resolve, reject) => {
          ably.connection.once('connected', resolve);
          ably.connection.once('failed', reject);
        });

        // Subscribe to storage updates
        channel.subscribe('storage-update', (message) => {
          const { currentUsage, totalStorage } = message.data;
          onStorageUpdate({ currentUsage, totalStorage });
        });
      } catch (error) {
        console.error('Failed to initialize Ably connection:', error);
      }
    };

    initializeConnection();

    return () => {
      if (channel) {
        try {
          channel.unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing from channel:', error);
        }
      }
      if (ably) {
        try {
          if (ably.connection.state !== 'closed' && ably.connection.state !== 'closing') {
            ably.close();
          }
        } catch (error) {
          console.warn('Error closing Ably connection:', error);
        }
      }
    };
  }, [user, onStorageUpdate]);
}