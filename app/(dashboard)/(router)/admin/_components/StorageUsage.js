"use client";
import React, { useMemo, useEffect, useState } from "react";
import { PieChart as RPieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { db } from "../../../../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { FileText, ImageIcon, Video, Archive } from "lucide-react";

const CATEGORY_DETAILS = {
    files: { color: "bg-blue-500", icon: <FileText className="w-5 h-5 text-blue-600" /> },
    images: { color: "bg-sky-500", icon: <ImageIcon className="w-5 h-5 text-sky-600" /> },
    videos: { color: "bg-cyan-500", icon: <Video className="w-5 h-5 text-cyan-600" /> },
    other: { color: "bg-indigo-500", icon: <Archive className="w-5 h-5 text-indigo-600" /> },
};

const getCategory = (fileName = "") => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (!ext) return "other";
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(ext)) return "images";
    if (["mp4", "mkv", "avi", "mov", "wmv", "webm"].includes(ext)) return "videos";
    if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "zip", "rar", "csv"].includes(ext)) return "files";
    return "other";
};

const BreakdownItem = ({ category, value, total }) => {
    const detail = CATEGORY_DETAILS[category];
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0 bg-blue-100/60 p-2 rounded-lg">{detail.icon}</div>
                <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800 capitalize">{category}</p>
                    <p className="text-xs text-gray-500">{value.toFixed(2)} MB</p>
                </div>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-1.5">
                <div className={`${detail.color} h-1.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

export default function StorageUsage({ storageLimit = 5 * 1024 }) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ files: 0, images: 0, videos: 0, other: 0 });

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const filesSnap = await getDocs(collection(db, "uploadedFile"));
            const foldersSnap = await getDocs(collection(db, "uploadedFolders"));
            let filesMB = 0, imagesMB = 0, videosMB = 0, otherMB = 0;

            filesSnap.forEach(doc => {
                const file = doc.data();
                const cat = getCategory(file.fileName);
                const sizeMB = file.fileSize ? file.fileSize / 1024 / 1024 : 0;
                if (cat === "files") filesMB += sizeMB;
                else if (cat === "images") imagesMB += sizeMB;
                else if (cat === "videos") videosMB += sizeMB;
                else otherMB += sizeMB;
            });

            foldersSnap.forEach(doc => {
                const folder = doc.data();
                if (Array.isArray(folder.files)) {
                    folder.files.forEach(f => {
                        const cat = getCategory(f.fileName);
                        const sizeMB = f.fileSize ? f.fileSize / 1024 / 1024 : 0;
                        if (cat === "files") filesMB += sizeMB;
                        else if (cat === "images") imagesMB += sizeMB;
                        else if (cat === "videos") videosMB += sizeMB;
                        else otherMB += sizeMB;
                    });
                }
            });
            setStats({ files: filesMB, images: imagesMB, videos: videosMB, other: otherMB });
            setLoading(false);
        }
        fetchData();
    }, []);

    const { totalStorage, percentUsed, remaining, percentUsedDisplay } = useMemo(() => {
        const total = stats.files + stats.images + stats.videos + stats.other;
        const limit = storageLimit;
        const rem = Math.max(0, limit - total);
        const percent = limit > 0 ? Math.min((total / limit) * 100, 100) : 0;
        const display = percent > 0 && percent < 0.1 ? "0.1" : percent.toFixed(1);
        return { totalStorage: total, percentUsed: percent, remaining: rem, percentUsedDisplay: display };
    }, [stats, storageLimit]);

    // Updated chart data for better accuracy
    const chartData = [
        { name: 'used', value: percentUsed },
        { name: 'remaining', value: 100 - percentUsed }
    ];
    const COLORS = ['#3b82f6', '#dbeafe'];

    return (
        <div className="w-full max-w-4xl mx-auto bg-white border border-blue-100 rounded-2xl shadow-sm p-4 sm:p-6 md:p-8">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Storage Usage</h1>
                <p className="text-sm text-gray-500">An overview of your cloud storage.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
                <div className="lg:col-span-2 flex flex-col items-center justify-center bg-white border border-gray-200/80 p-6 rounded-xl">
                    <div className="w-48 h-48 sm:w-56 sm:h-56 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RPieChart>
                                <Pie 
                                    data={chartData} 
                                    cx="50%" 
                                    cy="50%" 
                                    dataKey="value" 
                                    stroke="none" 
                                    innerRadius="70%" 
                                    outerRadius="100%" 
                                    cornerRadius={10}
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                     {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </RPieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-4xl sm:text-5xl font-extrabold text-blue-600">{loading ? "--" : `${percentUsedDisplay}%`}</p>
                            <p className="text-sm font-medium text-gray-500">Used</p>
                        </div>
                    </div>
                    <div className="text-center mt-4">
                        <p className="font-semibold text-gray-800">{loading ? "--" : `${totalStorage.toFixed(2)} MB of ${(storageLimit / 1024).toFixed(1)} GB`}</p>
                        <p className="text-xs text-gray-600 font-medium mt-1">{loading ? "--" : `${remaining.toFixed(2)} MB Remaining`}</p>
                    </div>
                </div>
                <div className="lg:col-span-3">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Breakdown by Category</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                        <BreakdownItem category="files" value={stats.files} total={totalStorage} />
                        <BreakdownItem category="images" value={stats.images} total={totalStorage} />
                        <BreakdownItem category="videos" value={stats.videos} total={totalStorage} />
                        <BreakdownItem category="other" value={stats.other} total={totalStorage} />
                    </div>
                </div>
            </div>
        </div>
    );
}
