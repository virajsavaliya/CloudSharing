// app/_components/PresenceProvider.js
"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import * as Ably from 'ably';
import { useAuth } from '../_utils/FirebaseAuthContext';
import toast from 'react-hot-toast';

const PresenceContext = createContext(null);
const peerConnectionConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const FILE_CHUNK_SIZE = 64 * 1024;

export const PresenceProvider = ({ children }) => {
  const { user } = useAuth();
  const ablyRef = useRef(null);
  const channelRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const fileOfferRef = useRef(null);
  const [peers, setPeers] = useState({});
  const peersRef = useRef(peers); // Use a ref to hold the latest peers without causing re-renders
  const [isConnected, setIsConnected] = useState(false);

  // Update the ref whenever the peers state changes
  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  const createPeerConnection = useCallback((peerId) => {
    if (peerConnectionsRef.current[peerId]) {
      peerConnectionsRef.current[peerId].peer.close();
    }
    const peer = new RTCPeerConnection(peerConnectionConfig);
    peerConnectionsRef.current[peerId] = { peer, candidates: [] };
    peer.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.publish('signal', {
          to: peerId,
          from: ablyRef.current.auth.clientId,
          signal: { candidate: event.candidate },
        });
      }
    };
    return peer;
  }, []);

  const initiateFileTransfer = useCallback((targetSocketId, targetUser, file) => {
    if (!channelRef.current || !user) return;
    channelRef.current.publish('signal', {
      to: targetSocketId,
      from: ablyRef.current.auth.clientId,
      signal: {
        type: 'file-offer',
        fileName: file.fileName,
        fileSize: file.fileSize,
        fromUser: { displayName: user.displayName, uid: user.uid },
      },
    });
    toast.success(`Request sent to ${targetUser?.displayName}. Waiting...`);
    fileOfferRef.current = { targetSocketId, file };
  }, [user]);

  const handleSignal = useCallback(async (message) => {
    const { from, to, signal } = message.data;
    if (to !== ablyRef.current.auth.clientId) return;

    if (signal.type) {
      switch (signal.type) {
        case 'file-offer':
          toast((t) => (
            <div className="rounded-xl shadow-lg p-4 bg-white/80 backdrop-blur-md">
              <p className="font-bold text-gray-800"><b>{signal.fromUser.displayName}</b> wants to send you:</p>
              <p className='text-center text-blue-600 my-2'>{signal.fileName}</p>
              <div className='flex gap-2'>
                <button className='w-full bg-green-500 text-white p-2 rounded-md' onClick={() => {
                  channelRef.current.publish('signal', { to: from, from: ablyRef.current.auth.clientId, signal: { type: 'file-accept' } });
                  toast.dismiss(t.id);
                }}>Accept</button>
                <button className='w-full bg-red-500 text-white p-2 rounded-md' onClick={() => {
                  channelRef.current.publish('signal', { to: from, from: ablyRef.current.auth.clientId, signal: { type: 'file-decline' } });
                  toast.dismiss(t.id);
                }}>Decline</button>
              </div>
            </div>
          ), { duration: 60000, position: 'top-center', style: { background: 'transparent', boxShadow: 'none' } });
          break;
        case 'file-accept':
          const { file, targetSocketId } = fileOfferRef.current || {};
          if (targetSocketId === from) {
            const peer = createPeerConnection(from);
            const dataChannel = peer.createDataChannel('file-transfer');
            const response = await fetch(file.fileUrl);
            const fileBlob = await response.blob();
            setupDataChannel(dataChannel, fileBlob, file);
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            channelRef.current.publish('signal', { to: from, from: ablyRef.current.auth.clientId, signal: { sdp: peer.localDescription } });
          }
          break;
        case 'file-decline':
          // Use the ref to get the latest peers data without causing a re-render
          toast.error(`${peersRef.current[from]?.displayName || 'Another user'} declined the transfer.`);
          break;
      }
      return;
    }

    let pcWrapper = peerConnectionsRef.current[from];
    if (signal.sdp) {
        if (signal.sdp.type === 'offer') {
            const peer = createPeerConnection(from);
            peer.ondatachannel = (event) => setupDataChannel(event.channel);
            await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            channelRef.current.publish('signal', { to: from, from: ablyRef.current.auth.clientId, signal: { sdp: peer.localDescription } });
        } else if (signal.sdp.type === 'answer') {
            if (!pcWrapper) return console.error("No peer connection found for answer");
            await pcWrapper.peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }
    } else if (signal.candidate) {
        if (!pcWrapper) return console.error("No peer connection found for candidate");
        const peer = pcWrapper.peer;
        if (peer.remoteDescription) {
            await peer.addIceCandidate(signal.candidate);
        } else {
            pcWrapper.candidates.push(signal.candidate);
        }
    }
  }, [createPeerConnection]); // Removed 'peers' from dependencies

  useEffect(() => {
    if (!user) {
      if (ablyRef.current) ablyRef.current.close();
      setIsConnected(false); setPeers({}); return;
    }
    const initAbly = () => {
      try {
        const ably = new Ably.Realtime({ authUrl: `/api/ably-token?clientId=${user.uid}` });
        ablyRef.current = ably;
        ably.connection.on('connected', () => {
          setIsConnected(true);
          const channel = ably.channels.get('file-sharing-room');
          channelRef.current = channel;
          channel.presence.subscribe(['enter', 'present'], (msg) => setPeers(prev => ({ ...prev, [msg.clientId]: msg.data })));
          channel.presence.subscribe('leave', (msg) => {
            setPeers(prev => {
              const newPeers = { ...prev }; delete newPeers[msg.clientId]; return newPeers;
            });
            if (peerConnectionsRef.current[msg.clientId]) {
              peerConnectionsRef.current[msg.clientId].peer.close();
              delete peerConnectionsRef.current[msg.clientId];
            }
          });
          channel.presence.enter({ displayName: user.displayName, uid: user.uid });
          channel.subscribe('signal', handleSignal);
        });
        ably.connection.on('disconnected', () => { setIsConnected(false); setPeers({}); peerConnectionsRef.current = {}; });
      } catch (error) {
        console.error("Error initializing Ably:", error);
        toast.error("Could not connect to real-time service.");
      }
    };
    initAbly();
    return () => { if (ablyRef.current) ablyRef.current.close(); };
  }, [user, handleSignal]);

  return (
    <PresenceContext.Provider value={{ peers, initiateFileTransfer, isConnected }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => useContext(PresenceContext);

function setupDataChannel(dataChannel, fileBlob, fileMetadata) {
    if (fileBlob) {
        let offset = 0;
        dataChannel.onopen = () => {
            dataChannel.send(JSON.stringify({ name: fileMetadata.fileName, size: fileBlob.size, type: fileMetadata.type }));
            const reader = new FileReader();
            reader.onload = ({ target }) => {
                if (dataChannel.readyState === 'open') {
                    dataChannel.send(target.result);
                    offset += target.result.byteLength;
                    if (offset < fileBlob.size) readSlice(offset);
                }
            };
            const readSlice = (o) => {
                const slice = fileBlob.slice(o, o + FILE_CHUNK_SIZE);
                reader.readAsArrayBuffer(slice);
            };
            readSlice(0);
        };
    } else {
        let receivedBuffers = [], fileInfo, receivedSize = 0, receiveToastId = null;
        dataChannel.onmessage = (event) => {
            if (typeof event.data === 'string') {
                fileInfo = JSON.parse(event.data);
                receiveToastId = toast.loading(`Receiving: ${fileInfo.name}... 0%`);
                return;
            }
            receivedBuffers.push(event.data);
            receivedSize += event.data.byteLength;
            const progress = Math.round((receivedSize / fileInfo.size) * 100);
            toast.loading(`Receiving: ${fileInfo.name}... ${progress}%`, { id: receiveToastId });
            if (receivedSize === fileInfo.size) {
                const receivedBlob = new Blob(receivedBuffers);
                toast.success(`'${fileInfo.name}' received!`, { id: receiveToastId, duration: 5000 });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(receivedBlob);
                link.download = fileInfo.name;
                document.body.appendChild(link);
                link.click();
                URL.revokeObjectURL(link.href);
                document.body.removeChild(link);
            }
        };
    }
}