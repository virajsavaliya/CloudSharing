"use client";
import { useEffect, useState } from 'react';
import { db } from "../../../../../firebaseConfig";
import { collection, getDocs } from 'firebase/firestore';
import {
  Home,
  Users,
  FileText,
  Database,
  Shield,
  BarChart2
} from "lucide-react";
import UsersTable from "./UsersTable";
import FilesTable from "./FilesTable";
import StorageUsage from "./StorageUsage";
import PremiumUsersTable from "./PremiumUsersTable";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ResponsiveContainer, BarChart as RBarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, PieChart as RPieChart, Pie, Cell, Legend } from "recharts";

// Modern Stat Card
function StatCard({ title, value, description, icon, color }) {
  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow flex flex-col items-center justify-center border border-blue-100">
      <div className={`mb-2 text-3xl ${color}`}>{icon}</div>
      <div className="text-3xl font-extrabold text-gray-800">{value}</div>
      <div className="text-base text-blue-700 font-semibold">{title}</div>
      <div className="text-xs text-gray-400 mt-1">{description}</div>
    </div>
  );
}

// Modern Bar Chart with Recharts
function BarChart({ label, value, max, color = "#3b82f6", unit = "" }) {
  const data = [
    { name: label, value: value },
    { name: "Remaining", value: Math.max(0, max - value) }
  ];
  return (
    <div className="w-full h-32">
      <ResponsiveContainer width="100%" height="100%">
        <RBarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <XAxis type="number" hide domain={[0, max]} />
          <YAxis type="category" dataKey="name" hide />
          <RTooltip
            cursor={{ fill: "#f3f4f6" }}
            contentStyle={{ borderRadius: 12, fontSize: 14 }}
            formatter={(v) => `${v}${unit}`}
          />
          <Bar dataKey="value" radius={[12, 12, 12, 12]}>
            <Cell fill={color} />
            <Cell fill="#e5e7eb" />
          </Bar>
        </RBarChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-xs mt-1 text-gray-500">
        <span>0{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// Modern Pie Chart with Recharts
function PieChart({ premium, free }) {
  const data = [
    { name: "Premium", value: premium },
    { name: "Free", value: free }
  ];
  const COLORS = ["#3b82f6", "#d1d5db"];
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={100} height={100}>
        <RPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={32}
            outerRadius={44}
            paddingAngle={2}
            dataKey="value"
            stroke="white"
            strokeWidth={3}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx]} />
            ))}
          </Pie>
        </RPieChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Premium</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-300 inline-block" /> Free</span>
      </div>
      <div className="mt-1 text-lg font-bold text-blue-700">
        {premium + free === 0 ? "0%" : `${Math.round((premium / (premium + free)) * 100)}% Premium`}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFiles: 0,
    totalStorage: 0,
    premiumUsers: 0,
    totalSales: 0,
    activeUsers: 0,
    storageLimit: 5 * 1024, // 5 GB in MB
  });
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [premiumList, setPremiumList] = useState([]);
  const [activity, setActivity] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [searchFile, setSearchFile] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user from Firebase Auth
    const auth = getAuth();
    setCurrentUser(auth.currentUser);
  }, []);

  useEffect(() => {
    // Fetch user role for nav visibility
    const fetchRole = async () => {
      if (currentUser && currentUser.uid) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        setUserRole(userDoc.exists() ? userDoc.data().role : null);
      }
    };
    fetchRole();
  }, [currentUser]);

  useEffect(() => {
    const fetchStats = async () => {
      // Users
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const totalUsers = usersList.length;

      // User Subscriptions
      const userSubSnap = await getDocs(collection(db, "userSubscriptions"));
      const userSubs = userSubSnap.docs.map(doc => doc.data());
      const premiumUsers = usersList.filter(u => {
        const sub = userSubs.find(s => s.userId === u.id);
        return sub && sub.plan && sub.plan !== 'Free';
      }).length;

      // --- Calculate Total Sales based on plan and duration ---
      const planPrices = {
        Pro: { monthly: 9.99 * 83, '3months': 9.99 * 83 * 3 * 0.85, annual: 9.99 * 83 * 12 * 0.7 },
        Premium: { monthly: 19.99 * 83, '3months': 19.99 * 83 * 3 * 0.85, annual: 19.99 * 83 * 12 * 0.7 }
      };
      let totalSales = 0;
      userSubs.forEach(sub => {
        if (sub.plan && sub.plan !== "Free") {
          const plan = sub.plan;
          const duration = sub.duration || "monthly";
          if (planPrices[plan] && planPrices[plan][duration]) {
            totalSales += Math.round(planPrices[plan][duration]);
          }
        }
      });

      // Files
      const filesSnap = await getDocs(collection(db, "uploadedFile"));
      const foldersSnap = await getDocs(collection(db, "uploadedFolders"));
      const filesArr = filesSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: "file" }));
      const foldersArr = foldersSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: "folder" }));
      const totalFiles = filesArr.length + foldersArr.length;
      const totalStorage = filesArr.reduce((acc, file) => acc + (file.fileSize || 0), 0) / (1024 * 1024); // MB

      // Active users (last 7 days)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const activeUsers = usersList.filter(u => {
        let lastLogin = u.lastLoginAt || u.lastSignInAt || u.lastLogin || u.lastSignIn;
        if (lastLogin?.toDate) lastLogin = lastLogin.toDate();
        if (typeof lastLogin === "string") lastLogin = new Date(lastLogin);
        return lastLogin && lastLogin >= sevenDaysAgo;
      }).length;

      // Premium user list
      const premiumList = usersList.filter(u => {
        const sub = userSubs.find(s => s.userId === u.id);
        return sub && sub.plan && sub.plan !== 'Free';
      }).map(u => ({
        ...u,
        plan: userSubs.find(s => s.userId === u.id)?.plan || "Pro",
        duration: userSubs.find(s => s.userId === u.id)?.duration || "monthly"
      }));
      setStats({
        totalUsers,
        totalFiles,
        totalStorage,
        premiumUsers,
        totalSales,
        activeUsers,
        storageLimit: 5 * 1024,
      });
      setUsers(usersList);
      setFiles([...filesArr, ...foldersArr]);
      setPremiumList(premiumList);
      setActivity(activity);
    };

    fetchStats();
  }, []);

  // Top navigation with Lucide icons (gray)
  const navOptions = [
    { key: "dashboard", label: "Dashboard", icon: <Home className="w-5 h-5 text-gray-500" /> },
    { key: "users", label: "Users", icon: <Users className="w-5 h-5 text-gray-500" /> },
    { key: "files", label: "Files", icon: <FileText className="w-5 h-5 text-gray-500" /> },
    { key: "storage", label: "Storage", icon: <Database className="w-5 h-5 text-gray-500" /> },
    { key: "premium", label: "Premium Users", icon: <Shield className="w-5 h-5 text-gray-500" /> },
  ];

  // Table helpers
  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchUser.toLowerCase())
  );
  const filteredFiles = files.filter(f =>
    (f.fileName || f.folderId || "").toLowerCase().includes(searchFile.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navigation bar */}
      <nav className="w-full bg-white shadow rounded-b-xl flex flex-wrap justify-center md:justify-start gap-2 md:gap-4 px-2 py-3 sticky top-0 z-20">
        {navOptions.map(opt => {
          // Only show admin options if userRole is 'admin'
          if (
            ["users", "files", "storage", "premium", "activity"].includes(opt.key) &&
            userRole !== "admin"
          ) {
            return null;
          }
          return (
            <button
              key={opt.key}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-left transition
                ${tab === opt.key
                  ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 shadow"
                  : "hover:bg-gray-100 text-gray-700"
                }`}
              onClick={() => {
                setTab(opt.key);
              }}
            >
              {opt.icon}
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          );
        })}
      </nav>
      {/* Main Content */}
      <main className="flex-1 flex flex-col px-2 md:px-8 pb-8 pt-4 overflow-x-auto">
        {tab === "dashboard" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-gray-600 mb-6">Overview of your platform</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                description="Registered users"
                icon={<Users className="w-8 h-8 text-blue-400" />}
                color=""
              />
              <StatCard
                title="Total Files"
                value={stats.totalFiles}
                description="Uploaded files & folders"
                icon={<FileText className="w-8 h-8 text-indigo-400" />}
                color=""
              />
              <StatCard
                title="Storage Used"
                value={`${stats.totalStorage.toFixed(2)} MB`}
                description={`Out of ${(stats.storageLimit / 1024).toFixed(1)} GB`}
                icon={<Database className="w-8 h-8 text-orange-400" />}
                color=""
              />
              <StatCard
                title="Premium Users"
                value={stats.premiumUsers}
                description="Paying customers"
                icon={<Shield className="w-8 h-8 text-yellow-400" />}
                color=""
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center border border-blue-50">
                <h2 className="text-lg font-semibold mb-2">Total Sales</h2>
                <div className="text-3xl font-bold text-green-600 mb-2">₹{stats.totalSales}</div>
                <BarChart label="Sales" value={stats.totalSales} max={10000} color="#22c55e" unit="" />
              </div>
              <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center border border-blue-50">
                <h2 className="text-lg font-semibold mb-2">Premium Users Ratio</h2>
                <PieChart premium={stats.premiumUsers} free={stats.totalUsers - stats.premiumUsers} />
              </div>
              <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center border border-blue-50">
                <h2 className="text-lg font-semibold mb-2">Active Users</h2>
                <div className="text-3xl font-bold text-blue-600 mb-2">{stats.activeUsers}</div>
                <BarChart label="Active Users" value={stats.activeUsers} max={stats.totalUsers || 1} color="#3b82f6" />
              </div>
              <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center border border-blue-50">
                <h2 className="text-lg font-semibold mb-2">Storage Usage</h2>
                <BarChart
                  label="Storage Used"
                  value={stats.totalStorage}
                  max={stats.storageLimit}
                  color="#f59e42"
                  unit="MB"
                />
                <div className="text-xs text-gray-500 mt-2">
                  {((stats.totalStorage / stats.storageLimit) * 100).toFixed(1)}% of 5 GB used
                </div>
              </div>
            </div>
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-md p-6 mt-8 border border-blue-50">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <ul className="divide-y">
                {activity.length === 0 && <li className="py-2 text-gray-400">No recent activity</li>}
                {activity.map((a, idx) => (
                  <li key={idx} className="py-3 flex items-center gap-4 hover:bg-blue-50 rounded-lg transition">
                    <span className="text-xl bg-blue-100 rounded-full p-2">
                      {a.type === "user"
                        ? <Users className="w-6 h-6 text-blue-500" />
                        : <FileText className="w-6 h-6 text-indigo-500" />}
                    </span>
                    <span className="flex-1 font-medium text-gray-700">{a.name}</span>
                    <span className="text-xs text-gray-500">{a.desc}</span>
                    <span className="text-xs text-gray-400">{a.date?.toLocaleString?.() || ""}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "users" && (
          <UsersTable users={users} searchUser={searchUser} setSearchUser={setSearchUser} />
        )}

        {tab === "files" && (
          <FilesTable files={files} searchFile={searchFile} setSearchFile={setSearchFile} />
        )}

        {tab === "storage" && (
          <StorageUsage stats={stats} />
        )}

        {tab === "premium" && (
          <PremiumUsersTable premiumList={premiumList} />
        )}
      </main>
      <style jsx global>{`
        .recharts-tooltip-wrapper {
          z-index: 50;
        }
      `}</style>
    </div>
  );
}