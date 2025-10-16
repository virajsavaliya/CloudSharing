"use client";
import React, { useState } from 'react';
import { Trash2, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../_utils/FirebaseAuthContext';
import { useRouter } from 'next/navigation';

export default function DeleteAccountSection() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE MY ACCOUNT") {
      setError('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("[Delete Account] Initiating account deletion for user:", user?.uid);

      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.uid }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("[Delete Account] Failed:", result.error);
        setError(result.error || "Failed to delete account. Please try again.");
        return;
      }

      console.log("[Delete Account] ✅ Account deleted successfully");
      
      // Show success message
      alert("Your account has been permanently deleted. Logging you out...");
      
      // Logout user
      await logout();
      
      // Redirect to home page
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err) {
      console.error("[Delete Account] Error:", err);
      setError("An error occurred while deleting your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-red-200 bg-red-50 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="text-red-600 mt-1" size={20} />
        <div>
          <h3 className="text-lg font-bold text-red-600">Delete Account</h3>
          <p className="text-sm text-red-600 mt-1">
            This action cannot be undone. All your data will be permanently deleted.
          </p>
        </div>
      </div>

      {/* Warning Details */}
      {!showConfirmation && (
        <div className="bg-red-100 border border-red-300 rounded p-3 mb-4 text-sm text-red-700">
          <p className="font-semibold mb-2">When you delete your account:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>All uploaded files will be deleted from cloud storage</li>
            <li>Your subscription information will be removed</li>
            <li>Payment history will be deleted</li>
            <li>Shared files and links will no longer be accessible</li>
            <li>Your account cannot be recovered</li>
          </ul>
        </div>
      )}

      {/* Confirmation Section */}
      {showConfirmation && (
        <div className="bg-white border border-red-300 rounded p-4 mb-4">
          <p className="text-sm font-semibold text-gray-800 mb-3">
            To confirm deletion, type <span className="text-red-600 font-bold">"DELETE MY ACCOUNT"</span> below:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value);
              setError("");
            }}
            placeholder='Type "DELETE MY ACCOUNT"'
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!showConfirmation ? (
          <>
            <button
              onClick={() => {
                setShowConfirmation(true);
                setConfirmText("");
                setError("");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              Delete My Account
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setShowConfirmation(false);
                setConfirmText("");
                setError("");
              }}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={loading || confirmText !== "DELETE MY ACCOUNT"}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Permanently Delete
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Additional Info */}
      <p className="text-xs text-gray-600 mt-4">
        If you need any assistance or have questions before deleting, please contact our support team.
      </p>
    </div>
  );
}
