import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';

const AddIdModal = ({ show, onClose, onConnect, idError, setIdError }) => {
  const [otherId, setOtherId] = useState("");
  if (!show) return null;

  const handleConnect = () => {
    if (otherId.trim()) onConnect(otherId.trim());
    else setIdError("Please enter a valid Chat ID.");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl text-gray-800 flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-indigo-600" /> Start New Chat
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500"/>
          </button>
        </div>
        <p className="text-gray-600 mb-4">Enter the unique Chat ID of the user you wish to connect with.</p>
        <input
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-2 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          placeholder="Enter Chat ID"
          value={otherId}
          onChange={(e) => { setOtherId(e.target.value); setIdError(""); }}
          onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          autoFocus
        />
        {idError && <div className="text-sm text-red-500 mb-4">{idError}</div>}
        <button
          className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
          onClick={handleConnect}
        >
          Connect
        </button>
      </div>
    </div>
  );
};

export default AddIdModal;