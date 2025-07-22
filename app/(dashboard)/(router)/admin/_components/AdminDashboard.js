"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { db } from "../../../../../firebaseConfig";
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Home, Users, FileText, Database, Shield, RefreshCw } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart as RPieChart, Pie, Cell } from "recharts";

// Import child components
import UsersTableView from './UsersTable';
import PremiumUsersTableView from './PremiumUsersTable';
import FilesTableView from './FilesTable';
import StorageUsageView from './StorageUsage';

// Reusable UI Components
const StatCard = ({ title, value, icon, iconBgColor }) => (
    <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm hover:shadow-lg transition-shadow duration-300">
        <div className="flex justify-between items-start">
            <div className="flex flex-col">
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${iconBgColor}`}>
                {icon}
            </div>
        </div>
    </div>
);

const AdminLayout = ({ children }) => (
    <div className="flex min-h-screen bg-white">
        <main className="flex-1 flex flex-col">
            <div className="flex-1 p-4 sm:p-6 lg:p-8">
                {children}
            </div>
        </main>
    </div>
);

// Main Admin Dashboard Component
export default function AdminDashboard() {
    const [tab, setTab] = useState("dashboard");
    const [stats, setStats] = useState({ totalUsers: 0, totalFiles: 0, totalStorage: 0, premiumUsers: 0, sales: 0, activeUsers: 0 });
    const [users, setUsers] = useState([]);
    const [files, setFiles] = useState([]);
    const [premiumUsers, setPremiumUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const navOptions = [
        { key: "dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
        { key: "users", label: "Users", icon: <Users className="w-5 h-5" /> },
        { key: "premium", label: "Premium Users", icon: <Shield className="w-5 h-5" /> },
        { key: "files", label: "Files", icon: <FileText className="w-5 h-5" /> },
        { key: "storage", label: "Storage", icon: <Database className="w-5 h-5" /> },
    ];

    const fetchData = async () => {
        setIsLoading(true);
        const usersSnap = await getDocs(collection(db, "users"));
        const usersList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(usersList);

        const filesSnap = await getDocs(collection(db, "uploadedFile"));
        const foldersSnap = await getDocs(collection(db, "uploadedFolders"));
        const filesList = filesSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'file' }));
        const foldersList = foldersSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'folder' }));
        setFiles([...filesList, ...foldersList]);

        const subsSnap = await getDocs(collection(db, "userSubscriptions"));
        const subsList = subsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const premiumUsersData = usersList.map(u => {
            const sub = subsList.find(s => s.userId === u.id && s.plan && s.plan !== "Free");
            if (sub) return { ...u, ...sub, subId: sub.id };
            return null;
        }).filter(Boolean);
        setPremiumUsers(premiumUsersData);

        const totalStorage = [...filesList, ...foldersList].reduce((acc, file) => acc + (file.fileSize || 0), 0) / (1024 * 1024);
        const planPrices = { Pro: { monthly: 830, '3months': 2115, annual: 6972 }, Premium: { monthly: 1660, '3months': 4233, annual: 13944 } };
        const totalSales = subsList.reduce((acc, sub) => acc + (planPrices[sub.plan]?.[sub.duration] || 0), 0);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const activeUsers = usersList.filter(u => u.lastLogin?.toDate() > sevenDaysAgo).length;

        setStats({ totalUsers: usersList.length, totalFiles: filesList.length + foldersList.length, totalStorage, premiumUsers: premiumUsersData.length, sales: totalSales, activeUsers });
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdate = async (id, data, collectionName) => {
        await updateDoc(doc(db, collectionName, id), data);
        fetchData();
    };

    const handleDelete = async (id, type) => {
        const collectionName = type === 'user' ? 'users' : (type === 'folder' ? 'uploadedFolders' : 'uploadedFile');
        if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
            await deleteDoc(doc(db, collectionName, id));
            fetchData();
        }
    };

    const renderContent = () => {
        const freeUsers = stats.totalUsers - stats.premiumUsers;
        const pieData = [
            { name: 'Premium', value: stats.premiumUsers, fill: '#3b82f6' },
            { name: 'Free', value: freeUsers, fill: '#a5b4fc' },
        ];
        const userGrowthData = users.reduce((acc, user) => {
            const date = user.createdAt?.toDate().toLocaleDateString() || 'N/A';
            const existing = acc.find(item => item.name === date);
            if (existing) existing.users += 1;
            else acc.push({ name: date, users: 1 });
            return acc;
        }, []).slice(-30);

        if (isLoading) return <div className="text-center py-10">Loading...</div>;

        switch (tab) {
            case "dashboard":
                return (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            <StatCard title="Total Users" value={stats.totalUsers} icon={<Users size={24} className="text-blue-500" />} iconBgColor="bg-blue-100" />
                            <StatCard title="Active Users (7d)" value={stats.activeUsers} icon={<Users size={24} className="text-green-500" />} iconBgColor="bg-green-100" />
                            <StatCard title="Total Sales" value={`₹${stats.sales.toLocaleString()}`} icon={<Shield size={24} className="text-orange-500" />} iconBgColor="bg-orange-100" />
                            <StatCard title="Storage Used" value={`${stats.totalStorage.toFixed(2)} MB`} icon={<Database size={24} className="text-indigo-500" />} iconBgColor="bg-indigo-100" />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
                            <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm">
                                <h3 className="font-bold text-lg text-gray-800">User Growth</h3>
                                <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={userGrowthData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}><XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false}/><YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/><Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '0.75rem' }}/><Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                            </div>
                            <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-center items-center">
                                <h3 className="font-bold text-lg text-gray-800 mb-4">User Tiers</h3>
                                <div className="w-48 h-48"><ResponsiveContainer width="100%" height="100%"><RPieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} cornerRadius={5}>{pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Pie><Tooltip /></RPieChart></ResponsiveContainer></div>
                                <div className="flex justify-center gap-4 mt-4 text-sm"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div>Premium</div><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-300"></div>Free</div></div>
                            </div>
                        </div>
                    </>
                );
            case "users": return <UsersTableView users={users} onUpdate={(id, data, coll) => handleUpdate(id, data, coll)} onDelete={(id, type) => handleDelete(id, type)} />;
            case "premium": return <PremiumUsersTableView premiumUsers={premiumUsers} onUpdate={(id, data, coll) => handleUpdate(id, data, coll)} />;
            case "files": return <FilesTableView files={files} onDelete={(id, type) => handleDelete(id, type)} />;
            case "storage": return <StorageUsageView />;
            default: return <div>Select a tab</div>;
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
                    <p className="text-gray-500 mt-1">Welcome back, Admin!</p>
                </div>
                <button onClick={fetchData} disabled={isLoading} className="flex-shrink-0 p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>
            
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 sm:space-x-6 overflow-x-auto" aria-label="Tabs">
                        {navOptions.map(opt => (
                            <button key={opt.key} onClick={() => setTab(opt.key)} className={`${tab === opt.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}>
                                {opt.icon}
                                <span className="hidden sm:inline">{opt.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {isLoading ? <div className="text-center py-10">Loading...</div> : renderContent()}
        </AdminLayout>
    );
}
