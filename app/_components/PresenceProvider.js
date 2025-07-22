"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../_utils/FirebaseAuthContext';
import toast from 'react-hot-toast';

const PresenceContext = createContext(null);
const peerConnectionConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const FILE_CHUNK_SIZE = 64 * 1024;

export const PresenceProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const fileOfferRef = useRef(null);
  const [peers, setPeers] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  const createPeerConnection = useCallback((peerId) => {
    if (peerConnectionsRef.current[peerId]) {
        peerConnectionsRef.current[peerId].peer.close();
    }
    const peer = new RTCPeerConnection(peerConnectionConfig);
    peerConnectionsRef.current[peerId] = { peer, candidates: [] };
    peer.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal', { to: peerId, from: socketRef.current.id, signal: { candidate: event.candidate } });
      }
    };
    peer.ondatachannel = (event) => setupDataChannel(event.channel);
    return peer;
  }, []);

  const initiateFileTransfer = useCallback((targetSocketId, targetUser, file) => {
    if (!socketRef.current) return;
    socketRef.current.emit('signal', {
      to: targetSocketId,
      from: socketRef.current.id,
      signal: {
        type: 'file-offer',
        fileName: file.fileName,
        fileSize: file.fileSize,
        fromUser: { displayName: user.displayName, uid: user.uid }
      }
    });
    toast.success(`Request sent to ${targetUser?.displayName}. Waiting...`);
    fileOfferRef.current = { targetSocketId, file };
  }, [user]);

  // Effect for managing the socket connection lifecycle.
  // This now only depends on `user`, so it won't re-run when `peers` changes.
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      setPeers({});
      return;
    }

    if (socketRef.current) return;

    const socket = io('https://cloudsharing-backend.onrender.com/');
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-room', { displayName: user.displayName, uid: user.uid });
    });
    socket.on('disconnect', () => {
        setIsConnected(false);
        setPeers({});
        peerConnectionsRef.current = {};
    });
    
    socket.on('existing-users', (existingUsers) => setPeers(existingUsers));
    socket.on('user-joined', (data) => setPeers(prev => ({ ...prev, [data.id]: data.user })));
    socket.on('user-left', (peerId) => {
      setPeers(prev => {
        const newPeers = { ...prev };
        delete newPeers[peerId];
        return newPeers;
      });
      if (peerConnectionsRef.current[peerId]) {
        peerConnectionsRef.current[peerId].peer.close();
        delete peerConnectionsRef.current[peerId];
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  // Effect for handling incoming signals.
  // This hook re-runs when `peers` changes, ensuring the signal handler has the latest `peers` state
  // without resetting the entire connection.
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const signalHandler = async (data) => {
      const { from, signal } = data;
      if (signal.type) {
        switch (signal.type) {
          case 'file-offer':
            toast((t) => (
              <div className="rounded-xl shadow-lg p-4 bg-white/80 backdrop-blur-md">
                <p className="font-bold text-gray-800"><b>{signal.fromUser.displayName}</b> wants to send you:</p>
                <p className='text-center text-blue-600 my-2'>{signal.fileName}</p>
                <div className='flex gap-2'>
                  <button className='w-full bg-green-500 text-white p-2 rounded-md' onClick={() => {
                    socket.emit('signal', { to: from, from: socket.id, signal: { type: 'file-accept' } });
                    toast.dismiss(t.id);
                  }}>Accept</button>
                  <button className='w-full bg-red-500 text-white p-2 rounded-md' onClick={() => {
                    socket.emit('signal', { to: from, from: socket.id, signal: { type: 'file-decline' } });
                    toast.dismiss(t.id);
                  }}>Decline</button>
                </div>
              </div>
            ), { duration: 60000, position: 'top-center', style: {background:'transparent', boxShadow:'none'} });
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
              socket.emit('signal', { to: from, from: socket.id, signal: { sdp: peer.localDescription } });
            }
            break;
          case 'file-decline':
            toast.error(`${peers[from]?.displayName || 'Another user'} declined the transfer.`);
            break;
        }
        return;
      }
      
      let pcWrapper = peerConnectionsRef.current[from];
      if (!pcWrapper) {
        pcWrapper = { peer: createPeerConnection(from), candidates: [] };
        peerConnectionsRef.current[from] = pcWrapper;
      }
      const peer = pcWrapper.peer;
      if (signal.sdp) {
        await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if (pcWrapper.candidates.length > 0) {
          for (const candidate of pcWrapper.candidates) await peer.addIceCandidate(candidate);
          pcWrapper.candidates = [];
        }
        if (signal.sdp.type === 'offer') {
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit('signal', { to: from, from: socket.id, signal: { sdp: peer.localDescription } });
        }
      } else if (signal.candidate) {
        if (peer.remoteDescription) await peer.addIceCandidate(signal.candidate);
        else pcWrapper.candidates.push(signal.candidate);
      }
    };

    socket.on('signal', signalHandler);

    return () => {
      socket.off('signal', signalHandler);
    };
  }, [peers, createPeerConnection]);

  return (
    <PresenceContext.Provider value={{ peers, initiateFileTransfer, isConnected }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => useContext(PresenceContext);

function setupDataChannel(dataChannel, fileBlob, fileMetadata) {
    if (fileBlob) { // SENDER
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
    } else { // RECEIVER
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
