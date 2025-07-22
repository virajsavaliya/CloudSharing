"use client";
import React, { useState, useMemo } from "react";
import { Search, Trash2 } from 'lucide-react';

export default function FilesTable({ files, onDelete }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFiles = useMemo(() =>
        files.filter(f =>
            (f.fileName || f.folderId || "").toLowerCase().includes(searchQuery.toLowerCase())
        ), [files, searchQuery]);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800">Files & Folders</h2>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
            </div>

             {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredFiles.map((file) => (
                     <div key={file.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start">
                             <p className="font-bold text-gray-800 truncate pr-4">{file.fileName || file.folderId}</p>
                             <button onClick={() => onDelete(file.id, file.type)} className="text-red-500 hover:text-red-700 flex-shrink-0">
                                <Trash2 size={20} />
                            </button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                             <div className="flex justify-between"><span className="font-medium text-gray-600">Type: </span><span className="capitalize">{file.type}</span></div>
                             <div className="flex justify-between truncate"><span className="font-medium text-gray-600">Owner: </span><span>{file.userEmail}</span></div>
                             <div className="flex justify-between"><span className="font-medium text-gray-600">Size: </span><span>{file.type === 'file' ? `${(file.fileSize / 1024 / 1024).toFixed(2)} MB` : `${file.files?.length || 0} items`}</span></div>
                        </div>
                     </div>
                ))}
            </div>


            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredFiles.map((file) => (
                            <tr key={file.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-xs">{file.fileName || file.folderId}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{file.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{file.userEmail}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {file.type === 'file' ? `${(file.fileSize / 1024 / 1024).toFixed(2)} MB` : `${file.files?.length || 0} items`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <button onClick={() => onDelete(file.id, file.type)} className="text-red-600 hover:text-red-800">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
