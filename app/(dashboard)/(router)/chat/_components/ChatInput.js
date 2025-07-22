import React from 'react';
import { Smile, Paperclip, Send } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const ChatInput = ({ selectedUser, input, setInput, sendMessage, showEmojiPicker, setShowEmojiPicker, inputRef }) => {

  const handleSend = () => {
    if (input.trim()) {
      sendMessage();
    }
  };

  const onEmojiClick = (emojiObject) => {
    setInput(prevInput => prevInput + emojiObject.emoji);
    inputRef.current?.focus();
  };

  if (!selectedUser) {
    return (
        <div className="p-4 text-center text-sm text-gray-400 bg-gray-100 rounded-full">
            Select a chat to start messaging
        </div>
    );
  }

  return (
    <div className="relative">
      {showEmojiPicker && (
        <div className="absolute bottom-16 z-10">
          <EmojiPicker onEmojiClick={onEmojiCick} />
        </div>
      )}
      <div className="flex items-center gap-3 bg-white rounded-full p-2 shadow-sm border">
         <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"><Smile /></button>
         <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"><Paperclip /></button>
        <input
          ref={inputRef}
          className="flex-1 bg-transparent focus:outline-none text-gray-800 placeholder-gray-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
        />
        <button onClick={handleSend} className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-md hover:shadow-lg transition-all" aria-label="Send message">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;