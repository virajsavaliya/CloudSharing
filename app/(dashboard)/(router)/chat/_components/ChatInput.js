import { Send } from 'lucide-react';

export default function ChatInput({ input, setInput, sendMessage, inputRef }) {
  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage();
    }
  };

  return (
    // ✅ Added flex-shrink-0 to prevent shrinking
    <form onSubmit={handleSend} className="p-4 border-t bg-white flex-shrink-0">
      <div className="max-w-4xl mx-auto flex items-center gap-2 bg-gray-100 rounded-lg p-2 border">
        <input
          ref={inputRef}
          className="flex-1 bg-transparent focus:outline-none px-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              handleSend(e);
            }
          }}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
          disabled={!input.trim()}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}