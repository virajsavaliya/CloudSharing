"use client";
import React, { useState, useMemo } from "react";
import { db } from "../../../../../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const PLAN_OPTIONS = ["Pro", "Premium"];
const DURATION_OPTIONS = ["monthly", "3months", "annual"];

export default function PremiumUsersTable({ premiumUsers, onUpdate }) {
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);

    const chartData = useMemo(() => {
        const dayMap = premiumUsers.reduce((acc, user) => {
            const date = user.createdAt?.toDate();
            if (date) {
                const dayKey = date.toISOString().slice(0, 10);
                acc[dayKey] = (acc[dayKey] || 0) + 1;
            }
            return acc;
        }, {});

        return Object.keys(dayMap).sort().map(dayKey => ({
            date: new Date(dayKey).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
            upgrades: dayMap[dayKey],
        }));
    }, [premiumUsers]);

    const handleEdit = (user) => {
        setEditingId(user.id);
        setEditData({ plan: user.plan, duration: user.duration });
    };

    const handleSave = async (user) => {
        setSaving(true);
        try {
            await onUpdate(user.subId, { plan: editData.plan, duration: editData.duration }, "userSubscriptions");
        } finally {
            setEditingId(null);
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Premium Upgrades History</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                            <YAxis allowDecimals={false} stroke="#9ca3af" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '0.75rem' }} />
                            <Line type="monotone" dataKey="upgrades" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Premium Users</h2>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {premiumUsers.map(user => (
                        <div key={user.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                             <p className="font-bold text-gray-800 truncate">{user.email}</p>
                             <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                <div className="text-sm flex justify-between items-center">
                                    <span className="font-medium text-gray-600">Plan: </span>
                                     {editingId === user.id ? (
                                        <select value={editData.plan} onChange={e => setEditData(d => ({ ...d, plan: e.target.value }))} className="border-gray-300 rounded-md text-sm">
                                            {PLAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    ) : (<span className="capitalize font-semibold">{user.plan}</span>)}
                                </div>
                                 <div className="text-sm flex justify-between items-center">
                                    <span className="font-medium text-gray-600">Duration: </span>
                                    {editingId === user.id ? (
                                        <select value={editData.duration} onChange={e => setEditData(d => ({ ...d, duration: e.target.value }))} className="border-gray-300 rounded-md text-sm">
                                            {DURATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    ) : (<span className="capitalize font-semibold">{user.duration}</span>)}
                                </div>
                                <div className="pt-2">
                                    {editingId === user.id ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSave(user)} disabled={saving} className="text-sm px-3 py-1 bg-blue-500 text-white rounded-md">Save</button>
                                            <button onClick={() => setEditingId(null)} className="text-sm px-3 py-1 bg-gray-200 rounded-md">Cancel</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => handleEdit(user)} className="text-sm font-medium text-blue-600">Edit Subscription</button>
                                    )}
                                </div>
                             </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {premiumUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {editingId === user.id ? (
                                            <select value={editData.plan} onChange={e => setEditData(d => ({ ...d, plan: e.target.value }))} className="border-gray-300 rounded-md">
                                                {PLAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : (<span className="capitalize">{user.plan}</span>)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {editingId === user.id ? (
                                            <select value={editData.duration} onChange={e => setEditData(d => ({ ...d, duration: e.target.value }))} className="border-gray-300 rounded-md">
                                                {DURATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : (<span className="capitalize">{user.duration}</span>)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        {editingId === user.id ? (
                                            <>
                                                <button onClick={() => handleSave(user)} disabled={saving} className="text-blue-600 hover:text-blue-800 mr-4">Save</button>
                                                <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700">Cancel</button>
                                            </>
                                        ) : (<button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-800">Edit</button>)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
