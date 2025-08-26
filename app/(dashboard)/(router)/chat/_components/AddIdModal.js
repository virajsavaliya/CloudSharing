// app/(dashboard)/(router)/chat/_components/AddIdModal.js
import React, { useState } from 'react';
import { MessageSquarePlus, X } from 'lucide-react';

const AddIdModal = ({ show, onClose, myChatId, onConnectAndSend }) => {
  const [otherId, setOtherId] = useState("");
  const [message, setMessage] = useState("");
  const [idError, setIdError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!show) return null;

  const handleSend = async () => {
    setIdError("");
    if (!otherId.trim() || otherId === myChatId) {
        setIdError(otherId === myChatId ? "You can't chat with yourself." : "Please enter a valid Chat ID.");
        return;
    }
     if (!message.trim()) {
        setIdError("Please enter a message to start the conversation.");
        return;
    }

    setIsLoading(true);
    try {
        // 1. Find the user
        const response = await fetch(`/api/find-user?chatId=${otherId.trim()}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "User not found");
        }
        const foundUser = data.user;

        // 2. Send the message via API
        await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: myChatId,
                receiverId: foundUser.chatId,
                message: message.trim()
            }),
        });

        // 3. Notify the parent component to update UI
        onConnectAndSend(foundUser);
        
        // 4. Clear state and close
        setOtherId("");
        setMessage("");
        onClose();
    } catch (error) {
        setIdError(error.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl text-gray-800 flex items-center gap-3">
            <MessageSquarePlus className="w-6 h-6 text-indigo-600" /> Start New Chat
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500"/>
          </button>
        </div>
        
        <label className="text-sm font-medium text-gray-700">Recipient's Chat ID</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mt-1 mb-4 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          placeholder="Enter Chat ID"
          value={otherId}
          onChange={(e) => { setOtherId(e.target.value); setIdError(""); }}
          autoFocus
        />
        
        <label className="text-sm font-medium text-gray-700">Your first message</label>
        <textarea
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mt-1 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          placeholder="Say hello!"
          rows={3}
          value={message}
          onChange={(e) => { setMessage(e.target.value); setIdError(""); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        {idError && <div className="text-sm text-red-500 mb-4">{idError}</div>}
        <button
          className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
          onClick={handleSend}
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send Message"}
        </button>
      </div>
    </div>
  );
};

export default AddIdModal;