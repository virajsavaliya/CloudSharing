"use client";

import React, { useState } from 'react';
import { usePresence } from './PresenceProvider';
import { useAuth } from '../_utils/FirebaseAuthContext';
import { Share2, UserCircle, Wifi, WifiOff } from 'lucide-react';
import JSZip from 'jszip';
import toast from 'react-hot-toast';

function OnlineUserList({ file }) {
    const { peers, initiateFileTransfer, isConnected } = usePresence();
    const { user } = useAuth();
    const [isZipping, setIsZipping] = useState(false);

    // ✅ ADD THIS LINE BACK
    const otherUsers = user ? Object.entries(peers || {}).filter(([uid, peerUser]) => uid !== user.uid) : [];

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
                // ✅ Use the correct property names you found in the console
                fileName: file.fileName || file.folderName, // Use fileName OR folderName
                fileSize: file.fileSize || file.size,
                fileUrl: file.fileUrl || file.zipUrl,   // Use fileUrl OR zipUrl
            };
            if (!fileToSend.fileName || !fileToSend.fileSize || !fileToSend.fileUrl) {
                toast.error("File data is incomplete and cannot be sent.");
                return;
            }

            initiateFileTransfer(peerId, peerUser, fileToSend);
        }
    };

    if (!user) return null;

    return (
        <div className="border p-5 rounded-md mt-5">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <Share2 size={20} />
                Share with Online Users
            </h3>
            <div className={`flex items-center gap-2 text-sm mt-2 ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
                {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <hr className="my-4" />
            <div className="space-y-3">
                {otherUsers.length > 0 ? (
                    otherUsers.map(([id, peerUser]) => (
                        <div key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center gap-3">
                                <UserCircle className="text-gray-500" />
                                <span className="text-gray-800 font-medium">{peerUser.displayName}</span>
                            </div>
                            <div className="w-36 text-right">
                                <button
                                    className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                                    onClick={() => handleShareClick(id, peerUser)}
                                    disabled={isZipping}
                                >
                                    {isZipping ? 'Zipping...' : 'Send'}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-sm text-center py-4">No other users are currently online on your network.</p>
                )}
            </div>
        </div>
    );
}

export default OnlineUserList;