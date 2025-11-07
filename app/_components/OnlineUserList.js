"use client";

import React, { useState, useEffect } from 'react';
import { usePresence } from './PresenceProvider';
import { useAuth } from '../_utils/FirebaseAuthContext';
import { Share2, UserCircle, Wifi, WifiOff, Network } from 'lucide-react';
import { motion } from 'framer-motion';
import JSZip from 'jszip';
import toast from 'react-hot-toast';

function OnlineUserList({ file }) {
    const { peers, initiateFileTransfer, isConnected } = usePresence();
    const { user } = useAuth();
    const [isZipping, setIsZipping] = useState(false);
    const [localNetworkUsers, setLocalNetworkUsers] = useState([]);
    const [isCheckingNetwork, setIsCheckingNetwork] = useState(true);

    // Filter users who are NOT the current user
    const otherUsers = user ? Object.entries(peers || {}).filter(([uid, peerUser]) => uid !== user.uid) : [];

    // Detect if users are on the same local network by checking subnet
    useEffect(() => {
        const checkLocalNetwork = async () => {
            if (!otherUsers.length) {
                setIsCheckingNetwork(false);
                setLocalNetworkUsers([]);
                return;
            }

            try {
                setIsCheckingNetwork(true);
                
                // Get current user's local IP
                const pc = new RTCPeerConnection({ iceServers: [] });
                pc.createDataChannel('');
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                // Wait for ICE candidate with local IP
                const myLocalIP = await new Promise((resolve) => {
                    const timeout = setTimeout(() => resolve(null), 2000);
                    pc.onicecandidate = (e) => {
                        if (e.candidate && e.candidate.candidate) {
                            const ipMatch = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);
                            if (ipMatch && ipMatch[1]) {
                                clearTimeout(timeout);
                                pc.close();
                                resolve(ipMatch[1]);
                            }
                        }
                    };
                });

                if (!myLocalIP) {
                    // If we can't detect local IP, hide users for security
                    console.warn('[Network Detection] Could not detect local IP');
                    setLocalNetworkUsers([]);
                    setIsCheckingNetwork(false);
                    return;
                }

                console.log('[Network Detection] My IP:', myLocalIP);

                // Check if my IP is private (local network)
                const myIPParts = myLocalIP.split('.');
                const firstOctet = parseInt(myIPParts[0]);
                const secondOctet = parseInt(myIPParts[1]);
                
                const isMyIPPrivate = 
                    firstOctet === 10 || 
                    (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) ||
                    (firstOctet === 192 && secondOctet === 168);

                if (!isMyIPPrivate) {
                    // I'm on public IP - don't show any users
                    console.log('[Network Detection] On public network, hiding all users');
                    setLocalNetworkUsers([]);
                    setIsCheckingNetwork(false);
                    return;
                }

                // My IP is private, now check each peer's subnet
                const mySubnet = `${myIPParts[0]}.${myIPParts[1]}.${myIPParts[2]}`; // e.g., "192.168.1"
                console.log('[Network Detection] My subnet:', mySubnet);

                // Filter users who need to share their IP through WebRTC
                // Since we can't get other users' IPs directly, we'll use a different approach:
                // Store and share subnet info through Ably presence data
                const sameNetworkUsers = [];
                
                for (const [id, peerUser] of otherUsers) {
                    // Check if peer has shared their subnet info
                    if (peerUser.subnet && peerUser.subnet === mySubnet) {
                        sameNetworkUsers.push([id, peerUser]);
                        console.log('[Network Detection] Same network user found:', peerUser.displayName, peerUser.subnet);
                    } else {
                        console.log('[Network Detection] Different network user:', peerUser.displayName, peerUser.subnet || 'no subnet');
                    }
                }

                setLocalNetworkUsers(sameNetworkUsers);

            } catch (error) {
                console.error("[Network Detection] Error:", error);
                // On error, don't show users for security
                setLocalNetworkUsers([]);
            } finally {
                setIsCheckingNetwork(false);
            }
        };

        checkLocalNetwork();
    }, [otherUsers.length, user]);

    const handleShareClick = async (peerId, peerUser) => {
        if (file && file.files && Array.isArray(file.files)) {
            setIsZipping(true);
            const toastId = toast.loading(`Zipping ${file.files.length} files... Please wait.`);
            try {
                const zip = new JSZip();
                for (const f of file.files) {
                    const response = await fetch(f.fileUrl);
                    const blob = await response.blob();
                    zip.file(f.fileName, blob);
                }
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                toast.success('Zipping complete!', { id: toastId });
                const fileToSend = {
                    fileName: `${file.fileName}.zip`,
                    fileSize: zipBlob.size,
                    fileUrl: URL.createObjectURL(zipBlob),
                };
                initiateFileTransfer(peerId, peerUser, fileToSend);
            } catch (error) {
                console.error("Error creating zip file:", error);
                toast.error("Failed to create zip file.", { id: toastId });
            } finally {
                setIsZipping(false);
            }
        } else {
            const fileToSend = {
                fileName: file.fileName || file.folderName,
                fileSize: file.fileSize || file.size,
                fileUrl: file.fileUrl || file.zipUrl,
            };
            if (!fileToSend.fileName || !fileToSend.fileSize || !fileToSend.fileUrl) {
                toast.error("File data is incomplete and cannot be sent.");
                return;
            }

            initiateFileTransfer(peerId, peerUser, fileToSend);
        }
    };

    if (!user) return null;

    // Don't show the section if no local network users
    if (!isCheckingNetwork && localNetworkUsers.length === 0 && otherUsers.length === 0) {
        return (
            <div className="text-center py-12">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-4 shadow-inner"
                >
                    <UserCircle size={48} className="text-gray-400" />
                </motion.div>
                <p className="text-gray-600 font-semibold text-lg mb-2">No Active Users</p>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                    When other users join your network, they'll appear here for instant file sharing
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Connection Status Badge */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl font-medium text-sm shadow-lg ${
                    isConnected 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                        : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                }`}
            >
                <div className="relative">
                    {isConnected ? <Wifi size={20} /> : <WifiOff size={20} />}
                    {isConnected && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></span>
                    )}
                </div>
                <span>{isConnected ? 'Connected to Network' : 'Network Disconnected'}</span>
            </motion.div>
            
            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gradient-to-br from-white via-blue-50/30 to-white text-gray-500 font-medium">
                        {localNetworkUsers.length} {localNetworkUsers.length === 1 ? 'User' : 'Users'} Available
                    </span>
                </div>
            </div>
            
            {/* Users List */}
            <div className="space-y-3">
                {isCheckingNetwork ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <div className="inline-flex flex-col items-center gap-4">
                            <div className="relative">
                                <Network size={40} className="text-[#007dfc] animate-spin" />
                                <div className="absolute inset-0 bg-[#007dfc] blur-xl opacity-30 animate-pulse"></div>
                            </div>
                            <div>
                                <p className="text-gray-700 font-semibold">Scanning Network...</p>
                                <p className="text-sm text-gray-500 mt-1">Looking for nearby users</p>
                            </div>
                        </div>
                    </motion.div>
                ) : localNetworkUsers.length > 0 ? (
                    localNetworkUsers.map(([id, peerUser], index) => (
                        <motion.div
                            key={id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            className="group relative"
                        >
                            {/* Hover Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#007dfc]/0 via-[#007dfc]/5 to-[#007dfc]/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="relative flex items-center justify-between p-5 bg-white border-2 border-gray-200 rounded-2xl hover:border-[#007dfc]/50 hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    {/* Avatar with Status */}
                                    <div className="relative">
                                        <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow-md group-hover:shadow-lg transition-shadow">
                                            <UserCircle className="text-[#007dfc]" size={32} />
                                        </div>
                                        {/* Online Status Indicator */}
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full shadow-lg">
                                            <span className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></span>
                                        </div>
                                    </div>
                                    
                                    {/* User Info */}
                                    <div>
                                        <p className="text-gray-900 font-bold text-lg">{peerUser.displayName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                Online Now
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Send Button */}
                                <button
                                    onClick={() => handleShareClick(id, peerUser)}
                                    disabled={isZipping}
                                    className="relative group/btn px-6 py-3 bg-gradient-to-r from-[#007dfc] to-blue-500 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-blue-500/50 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden"
                                >
                                    {/* Button Glow Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                                    
                                    <span className="relative flex items-center gap-2">
                                        {isZipping ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Preparing...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                                Send File
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    ))
                ) : otherUsers.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12 px-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl border-2 border-orange-200"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-3xl mb-4 shadow-lg">
                            <Network size={40} className="text-orange-500" />
                        </div>
                        <p className="text-gray-800 font-bold text-lg mb-2">Different Network Detected</p>
                        <p className="text-sm text-gray-600 max-w-md mx-auto">
                            Users detected but not on your local network. Direct file sharing requires same WiFi/network connection.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-4 shadow-inner">
                            <UserCircle size={40} className="text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-semibold text-lg mb-2">No Users Online</p>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                            Waiting for users to join your local network
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default OnlineUserList;