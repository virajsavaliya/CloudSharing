// app/(dashboard)/(router)/chat/_components/ChatRoom.js
"use client";
import { useChannel } from 'ably/react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
// **THE FIX IS HERE**: Ensure the import uses curly braces for a named import.
import { useChat } from '../hooks/useChat';

export default function ChatRoom({ myChatId, selectedUser, setSelectedUser, handleClearMessages, handleDeleteConversation }) {
  const { messages, setMessages, input, setInput, sendMessage, handleDeleteMessage, inputRef, messagesEndRef, isLoadingMore, handleLoadMore } = useChat(myChatId, selectedUser);

  const channelName = [myChatId, selectedUser.chatId].sort().join('_');

  useChannel(channelName, 'chat-message', (message) => {
    if (message.data.senderId !== myChatId) {
      setMessages((prev) => [...prev, { id: message.id, ...message.data, status: 'sent' }]);
    }
  });

  useChannel(channelName, 'message-deleted', (message) => {
    setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== message.data.messageId));
  });

  return (
    <main className="flex flex-col h-full w-full bg-gray-50">
      <ChatHeader 
        selectedUser={selectedUser} 
        setSelectedUser={setSelectedUser}
        onClearMessages={() => handleClearMessages(selectedUser.chatId)}
        onDeleteConversation={() => handleDeleteConversation(selectedUser.chatId)}
      />
      <ChatMessages
        messages={messages}
        chatId={myChatId}
        selectedUser={selectedUser}
        messagesEndRef={messagesEndRef}
        isLoadingMore={isLoadingMore}
        onLoadMore={handleLoadMore}
        handleDeleteMessage={handleDeleteMessage}
      />
      <ChatInput
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        inputRef={inputRef}
      />
    </main>
  );
}