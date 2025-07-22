"use client";
import React, { useState, useMemo, Fragment } from "react";
import { db } from "../../../../../firebaseConfig";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Search, MoreVertical } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';

export default function UsersTable({ users, onUpdate, onDelete }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [role, setRole] = useState('user');
    const [loadingId, setLoadingId] = useState(null);

    const filteredUsers = useMemo(() =>
        users.filter(u =>
            (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.lastName || '').toLowerCase().includes(searchQuery.toLowerCase())
        ), [users, searchQuery]);

    const handleEdit = (user) => {
        setEditingUser(user);
        setRole(user.role || 'user');
    };

    const handleSaveRole = async () => {
        if (!editingUser) return;
        setLoadingId(editingUser.id);
        try {
            await onUpdate(editingUser.id, { role }, 'users');
        } finally {
            setEditingUser(null);
            setLoadingId(null);
        }
    };

    const handleDeleteUser = async (userId) => {
        setLoadingId(userId);
        try {
            await onDelete(userId, 'user');
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800">All Users</h2>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredUsers.map(user => (
                    <div key={user.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-gray-800">{user.firstName} {user.lastName}</p>
                                <p className="text-sm text-gray-500 break-all">{user.email}</p>
                            </div>
                            <Menu as="div" className="relative flex-shrink-0">
                                <Menu.Button className="p-1 rounded-full text-gray-500 hover:bg-gray-200">
                                    <MoreVertical size={20} />
                                </Menu.Button>
                                <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                                    <Menu.Items className="absolute right-0 w-40 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                                        <div className="px-1 py-1"><Menu.Item>{({ active }) => (<button onClick={() => handleEdit(user)} className={`${active ? 'bg-blue-500 text-white' : 'text-gray-900'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>Edit Role</button>)}</Menu.Item><Menu.Item>{({ active }) => (<button onClick={() => handleDeleteUser(user.id)} className={`${active ? 'bg-red-500 text-white' : 'text-gray-900'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>Delete User</button>)}</Menu.Item></div>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="text-sm">
                                <span className="font-medium text-gray-600">Role: </span>
                                {editingUser?.id === user.id ? (
                                    <select value={role} onChange={(e) => setRole(e.target.value)} className="border-gray-300 rounded-md shadow-sm text-sm">
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                ) : (
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{user.role || 'user'}</span>
                                )}
                            </div>
                            <div className="text-sm mt-2"><span className="font-medium text-gray-600">Created: </span>{user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}</div>
                             {editingUser?.id === user.id && (
                                <div className="flex gap-2 mt-4">
                                    <button onClick={handleSaveRole} disabled={loadingId === user.id} className="text-sm px-3 py-1 bg-blue-500 text-white rounded-md">Save</button>
                                    <button onClick={() => setEditingUser(null)} className="text-sm px-3 py-1 bg-gray-200 rounded-md">Cancel</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                        <div className="text-sm text-gray-500 ml-2 truncate">({user.email})</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingUser?.id === user.id ? (
                                        <select value={role} onChange={(e) => setRole(e.target.value)} className="border-gray-300 rounded-md shadow-sm text-sm">
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    ) : (
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{user.role || 'user'}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {editingUser?.id === user.id ? (
                                        <div className="flex gap-4 justify-end">
                                            <button onClick={handleSaveRole} disabled={loadingId === user.id} className="text-blue-600 hover:text-blue-900 disabled:opacity-50">Save</button>
                                            <button onClick={() => setEditingUser(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                                        </div>
                                    ) : (
                                        <Menu as="div" className="relative inline-block text-left">
                                            <Menu.Button className="p-1 rounded-full hover:bg-gray-100 text-gray-500"><MoreVertical size={20} /></Menu.Button>
                                            <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                                                <Menu.Items className="absolute right-0 w-40 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                                                    <div className="px-1 py-1"><Menu.Item>{({ active }) => (<button onClick={() => handleEdit(user)} className={`${active ? 'bg-blue-500 text-white' : 'text-gray-900'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>Edit Role</button>)}</Menu.Item><Menu.Item>{({ active }) => (<button onClick={() => handleDeleteUser(user.id)} disabled={loadingId === user.id} className={`${active ? 'bg-red-500 text-white' : 'text-gray-900'} group flex rounded-md items-center w-full px-2 py-2 text-sm disabled:opacity-50`}>Delete User</button>)}</Menu.Item></div>
                                                </Menu.Items>
                                            </Transition>
                                        </Menu>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
