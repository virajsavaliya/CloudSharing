"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../_utils/FirebaseAuthContext";
import { useRouter } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../../../../firebaseConfig";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import Image from "next/image";
import { Settings, Lock, Shield, Trash2 } from "lucide-react";
import DeleteAccountSection from "../../../_components/DeleteAccountSection";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const db = getFirestore(app);
  
  const [activeTab, setActiveTab] = useState("account");
  const [userPlan, setUserPlan] = useState("Free");
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    const fetchUserPlan = async () => {
      if (!user) return;
      try {
        const userSubDoc = await getDoc(doc(db, "userSubscriptions", user.uid));
        if (userSubDoc.exists()) {
          setUserPlan(userSubDoc.data().plan || "Free");
        }
      } catch (error) {
        console.error("Error fetching user plan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlan();
  }, [user, authLoading, db, router]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !password || !confirmPassword) {
      setPasswordError("Please fill in all password fields");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (password.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (currentPassword === password) {
      setPasswordError("New password must be different from current password");
      return;
    }

    setPasswordLoading(true);

    try {
      const auth = getAuth();
      if (!auth.currentUser || !auth.currentUser.email) {
        throw new Error("User not authenticated");
      }

      // Re-authenticate with current password
      console.log("[Password Change] Re-authenticating user...");
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      console.log("[Password Change] Re-authentication successful");

      // Now update password
      console.log("[Password Change] Updating password...");
      await updatePassword(auth.currentUser, password);
      console.log("[Password Change] Password updated successfully");

      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully!");
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (error) {
      console.error("[Password Change] Error:", error);
      if (error.code === "auth/wrong-password") {
        setPasswordError("Current password is incorrect");
      } else if (error.code === "auth/requires-recent-login") {
        setPasswordError("Session expired. Please log out and log in again.");
      } else {
        setPasswordError(error.message || "Failed to update password");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Image
          src="/loader.gif"
          alt="Loading..."
          width={100}
          height={100}
          unoptimized
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Settings className="text-blue-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your account preferences and security</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2 bg-white rounded-lg shadow p-4">
              <button
                onClick={() => setActiveTab("account")}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "account"
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield size={18} />
                  Account
                </div>
              </button>

              <button
                onClick={() => setActiveTab("security")}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "security"
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Lock size={18} />
                  Security
                </div>
              </button>

              <hr className="my-2" />

              <button
                onClick={() => setActiveTab("delete")}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "delete"
                    ? "bg-red-50 text-red-600 font-semibold"
                    : "text-red-600 hover:bg-red-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Trash2 size={18} />
                  Delete Account
                </div>
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Information</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user.email || ""}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={user.displayName || ""}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Plan
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                          {userPlan}
                        </span>
                        <button
                          onClick={() => router.push("/upgrade")}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          Upgrade Plan
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Created
                      </label>
                      <input
                        type="text"
                        value={user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "N/A"}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>

                  <form className="space-y-6" onSubmit={handlePasswordChange}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          setPasswordError("");
                        }}
                        placeholder="Enter your current password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPasswordError("");
                        }}
                        placeholder="Enter new password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setPasswordError("");
                        }}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {passwordError && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z"></path>
                        </svg>
                        {passwordError}
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                        {passwordSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-60"
                    >
                      {passwordLoading ? "Updating..." : "Update Password"}
                    </button>
                  </form>

                  <div className="mt-8 pt-6 border-t">
                    <h3 className="font-semibold text-gray-900 mb-4">Session Management</h3>
                    <p className="text-gray-600 text-sm">
                      Your current session will remain active until you log out or it expires after 30 minutes of inactivity.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Account Tab */}
            {activeTab === "delete" && (
              <div className="space-y-6">
                <DeleteAccountSection />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
