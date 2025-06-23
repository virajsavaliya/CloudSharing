"use client";
import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { db } from "../../../../../firebaseConfig";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

const PremiumUsersChart = ({ chartData }) => (
  <div className="bg-white rounded-lg shadow-md p-4 mb-4">
    <h3 className="text-lg font-semibold mb-2">Premium Upgrades History</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey="upgrades" stroke="#4caf50" />
      </LineChart>
    </ResponsiveContainer>
    {chartData.length === 0 && (
      <div className="text-center text-gray-400 mt-8">No premium upgrades found.</div>
    )}
  </div>
);

const PLAN_OPTIONS = ["Pro", "Premium"];
const DURATION_OPTIONS = ["monthly", "3months", "annual"];

function PremiumUsersTable() {
  const [premiumList, setPremiumList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [chartData, setChartData] = useState([]);

  // Fetch premium users and their subscriptions
  useEffect(() => {
    async function fetchData() {
      // Fetch users
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch subscriptions
      const subsSnap = await getDocs(collection(db, "userSubscriptions"));
      const subs = subsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Join users with their subscription
      const premium = users
        .map(u => {
          const sub = subs.find(s => s.userId === u.id && s.plan && s.plan !== "Free");
          if (!sub) return null;
          return {
            ...u,
            plan: sub.plan,
            duration: sub.duration,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt,
            subId: sub.id,
          };
        })
        .filter(Boolean);

      setPremiumList(premium);

      // --- Chart Data: Show each upgrade as a point (date/time) ---
      // Sort by upgrade date
      const upgrades = premium
        .filter(u => u.updatedAt)
        .map(u => {
          const d = u.updatedAt.toDate ? u.updatedAt.toDate() : new Date(u.updatedAt);
          return {
            date: d,
            user: u.email || "",
            plan: u.plan || "",
          };
        })
        .sort((a, b) => a.date - b.date);

      // Prepare chart data: group by day (for X axis), count upgrades per day
      const dayMap = {};
      upgrades.forEach(upg => {
        const dayKey = upg.date.toISOString().slice(0, 10); // YYYY-MM-DD
        dayMap[dayKey] = (dayMap[dayKey] || 0) + 1;
      });

      // Build chart data array sorted by date
      const chartArr = Object.keys(dayMap)
        .sort()
        .map(dayKey => ({
          date: new Date(dayKey).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }),
          upgrades: dayMap[dayKey],
        }));

      setChartData(chartArr);
    }
    fetchData();
  }, []);

  // Handle edit
  const handleEdit = (user) => {
    setEditingId(user.id);
    setEditData({ plan: user.plan, duration: user.duration });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async (user) => {
    setSaving(true);
    try {
      // Update subscription in Firestore
      await updateDoc(doc(db, "userSubscriptions", user.subId), {
        plan: editData.plan,
        duration: editData.duration,
      });
      // Update local state
      setPremiumList(prev =>
        prev.map(u =>
          u.id === user.id
            ? { ...u, plan: editData.plan, duration: editData.duration }
            : u
        )
      );
      setEditingId(null);
      setEditData({});
    } catch (e) {
      alert("Failed to update subscription.");
    }
    setSaving(false);
  };

  return (
    <div>
      <PremiumUsersChart chartData={chartData} />

      <h2 className="text-2xl font-bold mb-4">Premium Users</h2>
      <div className="overflow-x-auto bg-white rounded-xl shadow-md p-2 md:p-4">
        <table className="min-w-full table-auto border-separate border-spacing-y-2 hidden md:table">
          <thead>
            <tr className="text-left text-gray-600 text-sm uppercase">
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">First Name</th>
              <th className="px-4 py-2">Last Name</th>
              <th className="px-4 py-2">Plan</th>
              <th className="px-4 py-2">Duration</th>
              <th className="px-4 py-2">Upgraded At</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {premiumList.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-6">
                  No premium users
                </td>
              </tr>
            ) : (
              premiumList.map((u) => {
                // Plan ring and badge
                let ringColor = "";
                let badge = "";
                if (u.plan === "Pro") {
                  ringColor = "ring-blue-400";
                  badge = (
                    <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold align-middle">
                      Pro
                    </span>
                  );
                } else if (u.plan === "Premium") {
                  ringColor = "ring-yellow-400";
                  badge = (
                    <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-semibold align-middle">
                      Premium
                    </span>
                  );
                }
                return (
                  <tr
                    key={u.id}
                    className="bg-gray-50 rounded-lg md:table-row"
                  >
                    <td className="px-4 py-2 font-medium text-sm text-gray-800 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ring-2 ${ringColor} flex items-center justify-center bg-white`}>
                        <span className="font-bold text-gray-700">
                          {u.firstName?.[0] || ""}{u.lastName?.[0] || ""}
                        </span>
                      </div>
                      <span>
                        {u.email}
                        {badge}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">{u.firstName}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{u.lastName}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {editingId === u.id ? (
                        <select
                          className="border rounded px-2 py-1"
                          value={editData.plan}
                          onChange={e => setEditData(ed => ({ ...ed, plan: e.target.value }))}
                        >
                          {PLAN_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="capitalize bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {u.plan}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {editingId === u.id ? (
                        <select
                          className="border rounded px-2 py-1"
                          value={editData.duration}
                          onChange={e => setEditData(ed => ({ ...ed, duration: e.target.value }))}
                        >
                          {DURATION_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="capitalize bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {u.duration}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {u.updatedAt?.toDate
                        ? u.updatedAt.toDate().toLocaleString()
                        : u.updatedAt?.toLocaleString?.() || ""}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {editingId === u.id ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                            onClick={() => handleSave(u)}
                            disabled={saving}
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button
                            className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
                            onClick={handleCancel}
                            disabled={saving}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600 text-sm"
                          onClick={() => handleEdit(u)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {/* Mobile Card View */}
        <div className="flex flex-col gap-3 md:hidden">
          {premiumList.length === 0 ? (
            <div className="text-center text-gray-400 py-6 bg-gray-50 rounded-lg">
              No premium users
            </div>
          ) : (
            premiumList.map((u) => {
              let ringColor = "";
              let badge = "";
              if (u.plan === "Pro") {
                ringColor = "ring-blue-400";
                badge = (
                  <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold align-middle">
                    Pro
                  </span>
                );
              } else if (u.plan === "Premium") {
                ringColor = "ring-yellow-400";
                badge = (
                  <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-semibold align-middle">
                    Premium
                  </span>
                );
              }
              return (
                <div key={u.id} className="bg-gray-50 rounded-xl shadow-sm p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ring-2 ${ringColor} flex items-center justify-center bg-white`}>
                      <span className="font-bold text-gray-700 text-lg">
                        {u.firstName?.[0] || ""}{u.lastName?.[0] || ""}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-base flex items-center">
                        {u.email}
                        {badge}
                      </div>
                      <div className="text-xs text-gray-500">{u.updatedAt?.toDate ? u.updatedAt.toDate().toLocaleString() : u.updatedAt?.toLocaleString?.() || ""}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold text-gray-500">First Name</span>
                      <span className="text-gray-700">{u.firstName}</span>
                    </div>
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold text-gray-500">Last Name</span>
                      <span className="text-gray-700">{u.lastName}</span>
                    </div>
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold text-gray-500">Plan</span>
                      {editingId === u.id ? (
                        <select
                          className="border rounded px-2 py-1"
                          value={editData.plan}
                          onChange={e => setEditData(ed => ({ ...ed, plan: e.target.value }))}
                        >
                          {PLAN_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="capitalize bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {u.plan}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold text-gray-500">Duration</span>
                      {editingId === u.id ? (
                        <select
                          className="border rounded px-2 py-1"
                          value={editData.duration}
                          onChange={e => setEditData(ed => ({ ...ed, duration: e.target.value }))}
                        >
                          {DURATION_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="capitalize bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {u.duration}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {editingId === u.id ? (
                      <>
                        <button
                          className="flex-1 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs"
                          onClick={() => handleSave(u)}
                          disabled={saving}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="flex-1 px-3 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs"
                          onClick={handleCancel}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="flex-1 px-3 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 text-xs"
                        onClick={() => handleEdit(u)}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <style jsx>{`
        @media (max-width: 768px) {
          table {
            display: none;
          }
        }
        @media (min-width: 768px) {
          .md\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default PremiumUsersTable;
