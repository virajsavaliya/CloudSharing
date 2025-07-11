import { Smile, X } from "lucide-react";
import UserAvatar from "./UserAvatar";
import ClockIcon from "./ClockIcon";

export default function ChatMessages({ chatApiError, selectedUser, messages, chatId, user, messagesEndRef, handleChatScroll }) {
  return (
    <section
      className="flex-1 flex flex-col justify-end px-2 md:px-8 py-4 overflow-y-auto"
      style={{
        minHeight: 0,
        maxHeight: "100%",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        flexGrow: 1,
        flexShrink: 1,
        display: "flex",
        flexDirection: "column",
      }}
      aria-label="Chat Messages"
      tabIndex={0}
      onScroll={handleChatScroll}
    >
      {chatApiError ? (
        <div className="flex-1 flex flex-col items-center justify-center text-red-500 font-semibold text-center p-8">
          <div className="text-3xl mb-2"><X className="w-8 h-8" /></div>
          <div>{chatApiError}</div>
        </div>
      ) : selectedUser ? (
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-end gap-2 ${msg.senderId === chatId ? "justify-end" : "justify-start"}`}
            >
              {msg.senderId !== chatId && (
                <UserAvatar user={selectedUser} size={32} fallbackBg="bg-blue-100" fallbackTextColor="text-blue-700" fallback="U" />
              )}
              <div className={`
                px-4 py-2 rounded-2xl max-w-[80vw] md:max-w-[40vw] break-words shadow
                ${msg.senderId === chatId
                  ? "bg-gradient-to-br from-green-200 to-green-100 text-gray-900 rounded-br-none"
                  : "bg-white/90 text-gray-800 rounded-bl-none"
                }
                relative
              `}>
                <span>{msg.message}</span>
                <span className="block text-[10px] text-gray-400 mt-1 text-right flex items-center gap-1">
                  <ClockIcon /> {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                </span>
              </div>
              {msg.senderId === chatId && (
                <UserAvatar user={user} size={32} fallbackBg="bg-green-100" fallbackTextColor="text-green-700" fallback="Y" />
              )}
            </div>
          ))}
          <div ref={el => {
            messagesEndRef.current = el;
            if (el && messagesEndRef.current._shouldAutoScroll !== false) {
              el.scrollIntoView({ behavior: "smooth" });
            }
          }} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <div className="text-4xl mb-2"><Smile className="w-10 h-10" /></div>
          <div className="font-bold text-lg">Select a chat to start messaging</div>
        </div>
      )}
    </section>
  );
}
