"use client";
import React, { useState } from "react";
import { db } from "../../../../../firebaseConfig";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";

function UsersTable({ users, searchUser, setSearchUser }) {
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleValue, setRoleValue] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [localUsers, setLocalUsers] = useState(users);

  // Sync localUsers with parent users prop
  React.useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  const filteredUsers = localUsers.filter(u =>
    u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const handleRoleEdit = (user) => {
    setEditingRoleId(user.id);
    setRoleValue(user.role || "user");
  };

  const handleRoleSave = async (userId) => {
    setLoadingId(userId);
    try {
      await updateDoc(doc(db, "users", userId), { role: roleValue });
      setLocalUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, role: roleValue } : u)
      );
      setEditingRoleId(null);
    } catch (e) {
      alert("Failed to update role");
    }
    setLoadingId(null);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    setLoadingId(userId);
    try {
      await deleteDoc(doc(db, "users", userId));
      setLocalUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e) {
      alert("Failed to delete user");
    }
    setLoadingId(null);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <h2 className="text-2xl font-bold">User List</h2>
        <input
          type="text"
          placeholder="Search users..."
          className="border rounded px-3 py-2 w-full md:w-64"
          value={searchUser}
          onChange={e => setSearchUser(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto bg-white rounded-xl shadow-md p-4">
        <table className="min-w-full table-auto border-separate border-spacing-y-2">
          <thead className="hidden md:table-header-group">
            <tr className="text-left text-gray-600 text-sm uppercase">
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">First Name</th>
              <th className="px-4 py-2">Last Name</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Created At</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-6">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="bg-gray-50 rounded-lg md:table-row flex flex-col md:flex-row mb-3 shadow-sm"
                >
                  <td className="px-4 py-2 font-medium text-sm text-gray-800 w-full md:w-auto">
                    <div className="md:hidden font-semibold">Email:</div>
                    {u.email}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 w-full md:w-auto">
                    <div className="md:hidden font-semibold">First Name:</div>
                    {u.firstName}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 w-full md:w-auto">
                    <div className="md:hidden font-semibold">Last Name:</div>
                    {u.lastName}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 w-full md:w-auto">
                    <div className="md:hidden font-semibold mb-1">Role:</div>
                    {editingRoleId === u.id ? (
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                        <select
                          className="border px-2 py-1 rounded-md text-sm"
                          value={roleValue}
                          onChange={(e) => setRoleValue(e.target.value)}
                          disabled={loadingId === u.id}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          className="text-blue-600 font-semibold px-2 py-1 rounded hover:underline"
                          onClick={() => handleRoleSave(u.id)}
                          disabled={loadingId === u.id}
                        >
                          {loadingId === u.id ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="text-gray-500 px-2 py-1 hover:underline"
                          onClick={() => setEditingRoleId(null)}
                          disabled={loadingId === u.id}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="capitalize bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {u.role || "user"}
                        </span>
                        <button
                          className="text-xs text-blue-500 underline hover:text-blue-700"
                          onClick={() => handleRoleEdit(u)}
                          disabled={loadingId === u.id}
                        >
                          Edit
                        </button>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 w-full md:w-auto">
                    <div className="md:hidden font-semibold">Created:</div>
                    {u.createdAt?.toDate
                      ? u.createdAt.toDate().toLocaleString()
                      : u.createdAt?.toLocaleString?.() || ""}
                  </td>
                  <td className="px-4 py-2 text-center w-full md:w-auto">
                    <button
                      className="text-red-500 hover:text-red-700 px-3 py-1 rounded-md hover:bg-red-100 text-sm"
                      onClick={() => handleDelete(u.id)}
                      disabled={loadingId === u.id}
                    >
                      {loadingId === u.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersTable;
