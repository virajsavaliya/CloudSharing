import { Menu, ClipboardCopy, User, Plus, X, Trash2, MoreVertical } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { shortId, shortName } from "./helpers";
import { useState } from "react";

export default function Sidebar({
  chatId,
  chatHistory,
  selectedUser,
  setSelectedUser,
  unreadCounts,
  handleCopyChatId,
  copied,
  handleDeleteHistoryUser,
  handleDeleteChatWithUser,
  showSidebar,
  setShowSidebar,
  showAddId,
  setShowAddId,
  otherId,
  setOtherId,
  handleConnectById,
  idError,
  isMobile,
}) {
  const [menuOpenId, setMenuOpenId] = useState(null);

  return (
    <aside
      className={`
        flex flex-col bg-white/80 backdrop-bl-md border-r border-gray-200 shadow-lg transition-all duration-200
        ${isMobile
          ? (showSidebar
            ? "fixed left-0 right-0 top-[56px] z-40 w-full h-[calc(100vh-56px)] max-h-[calc(100vh-56px)]"
            : "hidden")
          : "w-[340px] min-w-[260px] max-w-[400px] h-full"
        }
      `}
      style={{
        boxShadow: isMobile && showSidebar ? "0 0 0 100vmax rgba(0,0,0,0.2)" : undefined,
        height: isMobile && showSidebar ? "calc(100vh - 56px)" : undefined,
        maxHeight: isMobile && showSidebar ? "calc(100vh - 56px)" : undefined,
        overflowY: isMobile && showSidebar ? "auto" : undefined,
        WebkitOverflowScrolling: isMobile && showSidebar ? "touch" : undefined,
      }}
      aria-label="Chat Sidebar"
      tabIndex={0}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white/90 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <User className="text-blue-700 w-6 h-6" />
          <span className="font-bold text-blue-700 text-lg tracking-wide">Your ID</span>
          <span className="font-mono text-blue-900 bg-blue-100 px-2 py-1 rounded text-xs select-all shadow flex items-center gap-1">
            {shortId(chatId)}
            <button
              className="ml-1 p-1 rounded hover:bg-blue-200 transition"
              onClick={handleCopyChatId}
              title="Copy Chat ID"
              type="button"
            >
              <ClipboardCopy className="w-4 h-4 text-blue-700" />
            </button>
          </span>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-9 h-9 flex items-center justify-center shadow"
          onClick={() => setShowAddId(true)}
          title="Start new chat"
          aria-label="Start new chat"
        >
          <Plus className="w-6 h-6" />
        </button>
        {isMobile && (
          <button
            className="ml-2 text-gray-400 hover:text-gray-600 rounded-full p-2"
            onClick={() => setShowSidebar(false)}
            aria-label="Close"
            title="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
      <div className="px-6 py-3 border-b bg-white/80 flex items-center gap-2">
        <Menu className="w-5 h-5 text-blue-400" />
        <input
          className="w-full border border-gray-200 rounded-full px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          placeholder="Search or enter Chat ID"
          value={otherId}
          onChange={(e) => setOtherId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConnectById()}
          aria-label="Search or enter Chat ID"
        />
      </div>
      <div className="font-semibold text-blue-700 px-6 mt-5 mb-2 text-sm flex items-center gap-2">
        <Menu className="w-4 h-4" />
        Chats
      </div>
      {chatHistory.length === 0 && (
        <div className="text-xs text-gray-400 px-6 py-2 flex items-center gap-2">
          <User className="w-4 h-4" /> No chat history yet.
        </div>
      )}
      <ul className="flex-1 overflow-y-auto" aria-label="Chat History">
        {chatHistory.map((u) => (
          <li
            key={u.chatId}
            className={`flex items-center gap-3 px-6 py-3 border-b cursor-pointer hover:bg-blue-50 transition ${selectedUser?.chatId === u.chatId ? "bg-blue-100" : ""}`}
            onClick={() => {
              setSelectedUser(u);
              if (isMobile) setShowSidebar(false);
            }}
            title={u.chatId}
            tabIndex={0}
            aria-label={`Chat with ${u.displayName || u.email || u.chatId}`}
            onKeyDown={e => {
              if (e.key === "Enter") {
                setSelectedUser(u);
                if (isMobile) setShowSidebar(false);
              }
            }}
          >
            <UserAvatar user={u} size={40} fallbackBg="bg-blue-100" fallbackTextColor="text-blue-700" fallback="U" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{shortName(u.displayName || u.email || shortId(u.chatId))}</div>
              <div className="text-xs text-gray-400 font-mono truncate">ID: {shortId(u.chatId)}</div>
            </div>
            {unreadCounts[u.chatId] > 0 && (
              <span className="ml-2 bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs font-bold shadow flex items-center gap-1">
                {unreadCounts[u.chatId]}
              </span>
            )}
            {/* 3 dots menu */}
            <div className="relative ml-2">
              <button
                className="p-1 rounded-full hover:bg-gray-200"
                onClick={e => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === u.chatId ? null : u.chatId);
                }}
                aria-label="More options"
                title="More"
              >
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>
              {menuOpenId === u.chatId && (
                <div className="absolute right-0 top-8 bg-white border rounded shadow-lg z-50 min-w-[140px]">
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-blue-50 text-blue-700"
                    onClick={async e => {
                      e.stopPropagation();
                      setMenuOpenId(null);
                      await handleDeleteChatWithUser(u.chatId);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" /> Delete Chat
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-blue-50 text-blue-700"
                    onClick={e => {
                      e.stopPropagation();
                      setMenuOpenId(null);
                      handleDeleteHistoryUser(u.chatId);
                    }}
                  >
                    <X className="w-4 h-4 text-red-500" /> Remove User
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {isMobile && !showSidebar && (
        <button
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center text-3xl shadow-lg z-50"
          onClick={() => setShowAddId(true)}
          aria-label="Start new chat"
          title="Start new chat"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}
    </aside>
  );
}