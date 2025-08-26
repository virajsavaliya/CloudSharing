// app/(dashboard)/(router)/chat/_components/Sidebar.js
import { ClipboardCopy, Plus } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { useState } from "react";

export default function Sidebar({ myChatId, chatHistory = [], selectedUser, setSelectedUser, setShowAddId, setToastMessage }) {
  const [search, setSearch] = useState("");

  const handleCopy = () => {
    navigator.clipboard.writeText(myChatId);
    setToastMessage("Chat ID copied to clipboard!");
  };

  const filteredHistory = chatHistory.filter(u =>
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.chatId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
      ${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg">Your Chat ID</h2>
            <button onClick={handleCopy} className="p-2 rounded-full hover:bg-gray-100" title="Copy Chat ID">
                <ClipboardCopy className="w-5 h-5 text-gray-500" />
            </button>
        </div>
        <p className="font-mono text-sm text-gray-700 bg-gray-100 p-2 rounded break-all">{myChatId}</p>
      </div>

      <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg">Conversations</h2>
            <button onClick={() => setShowAddId(true)} className="p-2 rounded-full hover:bg-gray-100" title="Start New Chat">
                <Plus className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        <input
          type="text"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <ul className="flex-1 overflow-y-auto">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((user) => (
            <li key={user.chatId}>
              <button
                onClick={() => setSelectedUser(user)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-blue-50
                  ${selectedUser?.chatId === user.chatId ? 'bg-blue-50 border-r-4 border-blue-500' : ''}`}
              >
                <UserAvatar user={user} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user.displayName || user.email}</p>
                  <p className="text-sm text-gray-500 truncate">{user.chatId}</p>
                </div>
              </button>
            </li>
          ))
        ) : (
          <p className="p-4 text-sm text-center text-gray-400">No conversations found.</p>
        )}
      </ul>
    </aside>
  );
}