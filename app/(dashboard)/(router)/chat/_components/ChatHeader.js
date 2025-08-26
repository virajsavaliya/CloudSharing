// app/(dashboard)/(router)/chat/_components/ChatHeader.js
import { ArrowLeft, MoreVertical, Trash2, MessageCircleX } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { useState, useRef, useEffect } from "react";

export default function ChatHeader({ selectedUser, setSelectedUser, onClearMessages, onDeleteConversation }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b bg-white shadow-sm z-10 flex-shrink-0">
      {/* Back button for mobile */}
      <button onClick={() => setSelectedUser(null)} className="p-2 rounded-full hover:bg-gray-100 md:hidden">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
      </button>

      {selectedUser ? (
        <>
          <UserAvatar user={selectedUser} size={40} />
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{selectedUser.displayName || selectedUser.email}</p>
            <p className="text-xs text-gray-500 truncate">{selectedUser.chatId}</p>
          </div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-2 rounded-full hover:bg-gray-100">
                <MoreVertical className="w-5 h-5 text-gray-600"/>
            </button>
            {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 z-20 w-48 bg-white border rounded-md shadow-lg">
                    <ul className="py-1">
                        <li>
                            <button
                                onClick={() => {
                                    onClearMessages();
                                    setIsMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <MessageCircleX className="w-4 h-4" />
                                Clear Messages
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    onDeleteConversation();
                                    setIsMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete User
                            </button>
                        </li>
                    </ul>
                </div>
            )}
          </div>
        </>
      ) : (
        <div className="h-10"></div>
      )}
    </header>
  );
}