import { ArrowLeft } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { shortId, shortName } from "./helpers";

export default function ChatHeader({ selectedUser, isMobile, setSelectedUser, setShowSidebar }) {
  if (!selectedUser) return null;
  return (
    <header
      className="flex items-center gap-4 px-8 py-4 border-b bg-white/80 backdrop-blur-md shadow sticky top-0 z-30 rounded-bl-3xl"
      aria-label="Chat Header"
    >
      {isMobile && (
        <button
          className="mr-2 text-blue-700 text-2xl font-bold rounded-full p-2 hover:bg-blue-100"
          onClick={() => {
            setSelectedUser(null);
            setShowSidebar(true);
          }}
          aria-label="Back"
          style={{ minWidth: 36 }}
          title="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}
      <UserAvatar user={selectedUser} size={48} fallbackBg="bg-blue-200" fallbackTextColor="text-blue-700" fallback="U" />
      <div className="flex-1 flex flex-col min-w-0">
        <span className="font-semibold text-base truncate max-w-[80vw] md:max-w-[30vw]">
          {shortName(selectedUser.displayName || selectedUser.email || shortId(selectedUser.chatId), 18)}
        </span>
        <span className="text-xs text-blue-400 font-mono truncate max-w-[80vw] md:max-w-[30vw]">
          ID: {shortId(selectedUser.chatId)}
        </span>
      </div>
    </header>
  );
}