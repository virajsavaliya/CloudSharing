import React, { useRef, useEffect } from 'react';
import UserAvatar from './UserAvatar';
import { shortName } from './helpers';

const ChatMessages = ({ messages, chatId, selectedUser }) => {
  const messagesEndRef = useRef(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const renderMessagesWithGrouping = () => {
    let lastDate = null;
    return messages.map((msg, i) => {
      const msgDate = msg.timestamp ? new Date(msg.timestamp).toLocaleDateString() : null;
      const showDateSeparator = msgDate && msgDate !== lastDate;
      if (showDateSeparator) {
        lastDate = msgDate;
      }
      
      const isSender = msg.senderId === chatId;
      const prevMsg = messages[i - 1];
      const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId || showDateSeparator;

      return (
        <React.Fragment key={msg.id}>
          {showDateSeparator && (
            <div className="text-center text-xs text-gray-400 py-4">
              <span className="bg-gray-200 px-3 py-1 rounded-full">{new Date(msg.timestamp).toDateString()}</span>
            </div>
          )}
          <div className={`flex items-end gap-3 ${isSender ? "justify-end" : "justify-start"} ${isFirstInGroup ? 'mt-5' : 'mt-1'}`}>
            {!isSender && (<div className="w-8 self-end">{isFirstInGroup && <UserAvatar user={selectedUser} size={32} />}</div>)}
            <div className={`px-4 py-2.5 max-w-md lg:max-w-xl break-words rounded-2xl shadow-sm leading-relaxed ${isSender ? "bg-gradient-to-br from-indigo-500 to-blue-500 text-white rounded-br-lg" : "bg-gray-200 text-gray-800 rounded-bl-lg"}`}>
              {!isSender && isFirstInGroup && selectedUser && (<p className="font-bold text-sm text-indigo-600 mb-1">{shortName(selectedUser.displayName)}</p>)}
              <p>{msg.message}</p>
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  return (
    <div className="p-4 md:p-6">
        {renderMessagesWithGrouping()}
        <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;