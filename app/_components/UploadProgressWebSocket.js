"use client";

import { useEffect } from 'react';
import * as Ably from 'ably';
import { useAuth } from '../_utils/FirebaseAuthContext';

export function useUploadProgressSocket({ onProgressUpdate }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const ably = new Ably.Realtime({ authUrl: `/api/ably-token?clientId=${user.uid}` });
    const channel = ably.channels.get(`upload-${user.uid}`);

    // Subscribe to upload progress updates
    channel.subscribe('upload-progress', (message) => {
      const { fileId, progress, status } = message.data;
      onProgressUpdate({ fileId, progress, status });
    });

    return () => {
      channel.unsubscribe();
      ably.close();
    };
  }, [user, onProgressUpdate]);
}