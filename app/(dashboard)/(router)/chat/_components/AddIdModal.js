// app/(dashboard)/(router)/chat/_components/AddIdModal.js
import React, { useState } from 'react';
import { MessageSquarePlus, X, Loader2 } from 'lucide-react';

const AddIdModal = ({ show, onClose, myChatId, onConnectAndSend }) => {
  const [otherId, setOtherId] = useState("");
  const [idError, setIdError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!show) return null;

  const handleConnect = async () => {
    setIdError("");
    if (!otherId.trim() || otherId === myChatId) {
        setIdError(otherId === myChatId ? "You can't chat with yourself." : "Please enter a valid Chat ID.");
        return;
    }

    setIsLoading(true);
    try {
        const trimmedId = otherId.trim();
        const response = await fetch(`/api/find-user?chatId=${trimmedId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "User not found. Please check the Chat ID.");
        }
        const foundUser = data.user;

        onConnectAndSend(foundUser);
        setOtherId("");
        onClose();
    } catch (error) {
        setIdError(error.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl text-gray-800 flex items-center gap-3">
            <MessageSquarePlus className="w-6 h-6 text-indigo-600" /> Connect with User
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500"/>
          </button>
        </div>
        
        <label className="text-sm font-medium text-gray-700">Enter Chat ID to Connect</label>
        <input
          className={`w-full border ${idError ? 'border-red-300' : 'border-gray-300'} rounded-lg px-4 py-3 mt-1 mb-4 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
          placeholder="Enter Chat ID"
          value={otherId}
          onChange={(e) => { setOtherId(e.target.value); setIdError(""); }}
          disabled={isLoading}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isLoading) {
              e.preventDefault();
              handleConnect();
            }
          }}
        />

        {idError && (
          <div className="text-sm text-red-500 mb-4 flex items-center gap-2">
            <span className="inline-block w-4 h-4">⚠️</span>
            {idError}
          </div>
        )}
        
        <button
          className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          onClick={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect"
          )}
        </button>
      </div>
    </div>
  );
};

export default AddIdModal;