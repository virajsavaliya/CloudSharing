import { Smile, Send } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

export default function ChatInput({ selectedUser, input, setInput, sendMessage, showEmojiPicker, setShowEmojiPicker, inputRef }) {
  if (!selectedUser) return null;
  return (
    <footer className="px-4 py-4 border-t bg-white/90 backdrop-blur-md flex gap-2 items-center sticky bottom-0 z-20" aria-label="Chat Input">
      <div className="relative">
        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          title="Insert emoji"
          aria-label="Insert emoji"
        >
          <Smile className="w-7 h-7 text-gray-400" />
        </button>
        {showEmojiPicker && (
          <div className="absolute bottom-12 left-0 z-50">
            <EmojiPicker
              onEmojiClick={(emojiObject) => {
                setInput((prev) => prev + emojiObject.emoji);
                setShowEmojiPicker(false);
                inputRef.current && inputRef.current.focus();
              }}
              theme="light"
            />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        className="flex-1 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        aria-label="Type a message"
      />
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full shadow transition flex items-center gap-2"
        onClick={sendMessage}
        aria-label="Send message"
        title="Send"
      >
        <Send className="w-5 h-5" />
        <span className="hidden md:inline">Send</span>
      </button>
    </footer>
  );
}
