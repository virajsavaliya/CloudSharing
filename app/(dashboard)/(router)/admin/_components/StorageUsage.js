"use client";
import React, { useMemo, useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { db } from "../../../../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const COLORS = ["#3b82f6", "#f59e42", "#10b981", "#a855f7"];

function getCategory(fileName = "") {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext) return "other";
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(ext)) return "images";
  if (["mp4", "mkv", "avi", "mov", "wmv", "webm"].includes(ext)) return "videos";
  if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "zip", "rar", "csv"].includes(ext)) return "files";
  return "other";
}

function StorageUsage({ storageLimit = 5 * 1024 }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    files: 0,
    images: 0,
    videos: 0,
    other: 0,
    storageLimit,
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch all files and folders from Firestore
      const filesSnap = await getDocs(collection(db, "uploadedFile"));
      const foldersSnap = await getDocs(collection(db, "uploadedFolders"));
      let filesMB = 0, imagesMB = 0, videosMB = 0, otherMB = 0;

      // Single files
      filesSnap.forEach(doc => {
        const file = doc.data();
        const cat = getCategory(file.fileName);
        const sizeMB = file.fileSize ? file.fileSize / 1024 / 1024 : 0;
        if (cat === "files") filesMB += sizeMB;
        else if (cat === "images") imagesMB += sizeMB;
        else if (cat === "videos") videosMB += sizeMB;
        else otherMB += sizeMB;
      });

      // Folders (sum all contained files)
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

      setStats({
        files: filesMB,
        images: imagesMB,
        videos: videosMB,
        other: otherMB,
        storageLimit,
      });
      setLoading(false);
    }
    fetchData();
  }, [storageLimit]);

  const totalStorage = stats.files + stats.images + stats.videos + stats.other;
  const remaining = stats.storageLimit - totalStorage;
  let percentUsedRaw = (totalStorage / stats.storageLimit) * 100;
  let percentUsed = Math.min(percentUsedRaw, 100);
  let percentUsedDisplay =
    percentUsed > 0 && percentUsed < 0.1
      ? "0.1"
      : percentUsed.toFixed(1);

  const data = useMemo(() => [
    { name: "Files", value: stats.files },
    { name: "Images", value: stats.images },
    { name: "Videos", value: stats.videos },
    { name: "Other", value: stats.other },
    { name: "Remaining", value: remaining > 0 ? remaining : 0 },
  ], [stats, remaining]);

  return (
    <div className="min-h-screen w-full from-blue-50 to-purple-100 flex items-center justify-center py-6 px-1 md:py-10 md:px-2">
      <div className="w-full max-w-6xl bg-white/90 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center md:items-stretch gap-0 md:gap-0 overflow-hidden border border-gray-100">
        {/* Chart Section */}
        <div className="flex-1 flex flex-col justify-center items-center py-8 px-2 sm:px-4 md:px-12 bg-gradient-to-br from-white via-blue-50 to-purple-50 w-full">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 mb-6 sm:mb-8 text-center tracking-tight">
            Storage Usage
          </h2>
          <div className="w-full flex justify-center items-center relative" style={{ minHeight: 260 }}>
            <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 220 : 360} minWidth={180} minHeight={180}>
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={window.innerWidth < 640 ? 50 : 100}
                  outerRadius={window.innerWidth < 640 ? 80 : 150}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={3}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={1200}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 4 ? "#e5e7eb" : COLORS[index]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 15, boxShadow: "0 2px 12px #0001" }}
                  cursor={{ fill: "#f3f4f6" }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontWeight: 500, fontSize: window.innerWidth < 640 ? 12 : 16, marginTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Centered percentage overlay - fixed position */}
            <div
              className="pointer-events-none select-none"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 10,
                minWidth: 80,
                textAlign: "center"
              }}
            >
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-blue-600 drop-shadow-lg animate-fadein">
                {loading ? "--" : percentUsedDisplay}%
              </div>
              <div className="text-sm sm:text-base md:text-lg text-gray-500 mt-2 text-center font-medium">
                Used
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 text-center">
            <div className="text-base sm:text-lg md:text-xl font-semibold text-gray-700">
              {loading ? "--" : totalStorage.toFixed(2)} MB <span className="text-gray-400 font-normal">of</span> {(stats.storageLimit / 1024).toFixed(1)} GB used
            </div>
            <div className="text-xs sm:text-sm text-gray-400 mt-1">
              {loading ? "--" : (remaining > 0 ? remaining.toFixed(2) : 0)} MB remaining
            </div>
          </div>
        </div>
        {/* Details Section */}
        <div className="flex-1 bg-gradient-to-tl from-purple-50 via-white to-blue-50 flex flex-col justify-center px-4 sm:px-8 py-8 sm:py-12 md:py-20 border-t md:border-t-0 md:border-l border-gray-100 w-full">
          <div className="max-w-xs mx-auto w-full">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">Breakdown</h3>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded-full" style={{ background: COLORS[0] }}></span>
                  <span className="font-medium text-gray-700">Files</span>
                </span>
                <span className="font-semibold text-gray-900">{loading ? "--" : stats.files.toFixed(2)} MB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded-full" style={{ background: COLORS[1] }}></span>
                  <span className="font-medium text-gray-700">Images</span>
                </span>
                <span className="font-semibold text-gray-900">{loading ? "--" : stats.images.toFixed(2)} MB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded-full" style={{ background: COLORS[2] }}></span>
                  <span className="font-medium text-gray-700">Videos</span>
                </span>
                <span className="font-semibold text-gray-900">{loading ? "--" : stats.videos.toFixed(2)} MB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded-full" style={{ background: COLORS[3] }}></span>
                  <span className="font-medium text-gray-700">Other</span>
                </span>
                <span className="font-semibold text-gray-900">{loading ? "--" : stats.other.toFixed(2)} MB</span>
              </div>
              <div className="flex items-center justify-between border-t pt-4 sm:pt-6 mt-4 sm:mt-6">
                <span className="font-semibold text-green-600">Remaining</span>
                <span className="font-bold text-green-700">{loading ? "--" : (remaining > 0 ? remaining.toFixed(2) : 0)} MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Animation keyframes and responsive tweaks */}
      <style jsx>{`
        @keyframes fadein {
          0% { opacity: 0; transform: scale(0.9);}
          100% { opacity: 1; transform: scale(1);}
        }
        .animate-fadein {
          animation: fadein 1.2s cubic-bezier(0.4,0,0.2,1) both;
        }
        @media (max-width: 900px) {
          .max-w-6xl {
            max-width: 100vw !important;
          }
        }
        @media (max-width: 640px) {
          .rounded-3xl {
            border-radius: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
}

export default StorageUsage;
