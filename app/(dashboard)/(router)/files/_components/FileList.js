"use client";
import React, { useState } from 'react';
import { db, storage, moveToRecycleBin } from "../../../../../firebaseConfig";
import { toast } from 'react-toastify';
import Image from "next/image";
import { getFileIcon } from "../../../../../_utils/fileIcons";

function FileList({ files = [], setFiles, onDelete, onDownload }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const deleteFile = async (file) => {
        try {
            const isConfirmed = window.confirm("Are you sure you want to move this file to recycle bin?");
            if (!isConfirmed) return;

            const moved = await moveToRecycleBin(file, file.id);
            if (moved) {
                setFiles(prevFiles => prevFiles.filter(f => f.id !== file.id));
                onDelete && onDelete(file);
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Failed to move file to recycle bin");
        }
    };

    const handleDownload = (file) => {
        try {
            window.open(file.fileUrl, '_blank');
            onDownload && onDownload(file);
        } catch (error) {
            toast.error("Error downloading file");
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
            {files.map((file) => (
                <div key={file.id} 
                     className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <Image
                            src={getFileIcon(file)}  // Pass the whole file object
                            width={40}
                            height={40}
                            alt="File icon"
                        />
                        <button 
                            onClick={() => deleteFile(file)}
                            className="text-red-500 hover:text-red-700"
                        >
                            <Image
                                src="/delete.png"
                                width={20}
                                height={20}
                                alt="Delete"
                            />
                        </button>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-semibold truncate" title={file.fileName}>
                            {file.fileName}
                        </h3>
                        <p className="text-sm text-gray-500">
                            Size: {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                            onClick={() => handleDownload(file)}
                            className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                            Download
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default FileList;