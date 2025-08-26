"use client";
import React, { useState, useRef, useEffect } from 'react';
import UserAvatar from "./UserAvatar";
import Image from "next/image";
import { Trash2, ChevronDown, Clock, CheckCheck } from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

const formatDateSeparator = (dateString) => {
    // Safety Check: If dateString is invalid, don't crash
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date)) return null;

    if (isToday(date)) {
        return 'Today';
    }
    if (isYesterday(date)) {
        return 'Yesterday';
    }
    return format(date, 'MMMM d, yyyy');
};


export default function ChatMessages({ messages, chatId, selectedUser, messagesEndRef, isLoadingMore, onLoadMore, handleDeleteMessage }) {
  const scrollRef = useRef(null);
  const menuRef = useRef(null);
  const [openMessageMenu, setOpenMessageMenu] = useState(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMessageMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const handleScroll = () => {
    if (scrollRef.current?.scrollTop === 0 && !isLoadingMore) {
      onLoadMore();
    }
  };
  
  const confirmAndDelete = (messageId) => {
    if(window.confirm("Are you sure you want to delete this message? This cannot be undone.")) {
        handleDeleteMessage(messageId);
    }
    setOpenMessageMenu(null);
  }

  const handleMenuToggle = (messageId) => {
    setOpenMessageMenu(prev => (prev === messageId ? null : messageId));
  };
  
  // --- START OF NEW CODE ---
  // If it's the very first load (messages are empty but we are loading), show a centered loader.
  if (isLoadingMore && messages.length === 0) {
    return (
        <div className="flex-1 flex items-center justify-center h-full">
            <Image src="/loader.gif" width={150} height={150} alt="Loading messages..." />
        </div>
    );
  }
  // --- END OF NEW CODE ---


  return (
    <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
      <div className="w-full">
        {/* This loader is for when you scroll up to load *more* messages. It's smaller and at the top. */}
        {isLoadingMore && messages.length > 0 && (
          <div className="flex justify-center my-4">
            <Image src="/loader.gif" width={40} height={40} alt="Loading older messages..." />
          </div>
        )}
        {messages.length > 0 ? (
          messages.map((msg, i) => {
            if (!msg || !msg.timestamp) {
                return null;
            }

            const isSender = msg.senderId === chatId;
            const prevMsg = messages[i - 1];
            
            const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
            const isLastInGroup = !messages[i + 1] || messages[i + 1].senderId !== msg.senderId;
            
            const showDateSeparator = !prevMsg || !isSameDay(new Date(msg.timestamp), new Date(prevMsg.timestamp));

            let bubbleClassNames = "px-4 py-2 max-w-sm break-words shadow-sm ";
            if (isSender) {
              bubbleClassNames += "bg-blue-500 text-white ";
              if (isFirstInGroup && isLastInGroup) bubbleClassNames += "rounded-2xl";
              else if (isFirstInGroup) bubbleClassNames += "rounded-t-2xl rounded-bl-2xl rounded-br-md";
              else if (isLastInGroup) bubbleClassNames += "rounded-b-2xl rounded-tl-2xl rounded-tr-md";
              else bubbleClassNames += "rounded-l-2xl rounded-r-md";
            } else {
              bubbleClassNames += "bg-gray-200 text-gray-800 ";
              if (isFirstInGroup && isLastInGroup) bubbleClassNames += "rounded-2xl";
              else if (isFirstInGroup) bubbleClassNames += "rounded-t-2xl rounded-br-2xl rounded-bl-md";
              else if (isLastInGroup) bubbleClassNames += "rounded-b-2xl rounded-tr-2xl rounded-tl-md";
              else bubbleClassNames += "rounded-r-2xl rounded-l-md";
            }

            return (
              <React.Fragment key={msg.id || i}>
                {showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <div className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                      {formatDateSeparator(msg.timestamp)}
                    </div>
                  </div>
                )}

                <div className={`flex items-end gap-2 ${isSender ? "justify-end" : "justify-start"} ${isFirstInGroup ? 'mt-4' : 'mt-1'}`}>
                  {!isSender && (
                    <div className="w-8 self-end mb-1 flex-shrink-0">
                      {isLastInGroup && <UserAvatar user={selectedUser} size={32} />}
                    </div>
                  )}
                  
                  <div className="group relative">
                    <div className={bubbleClassNames}>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      
                      <div className="flex justify-end items-center gap-1.5 mt-1">
                          <span className={`text-xs ${isSender ? 'text-blue-200' : 'text-gray-500'}`}>
                              {format(new Date(msg.timestamp), 'p')}
                          </span>
                          {isSender && (
                            <>
                              {msg.status === 'sending' && <Clock size={14} className="text-blue-200" />}
                              {msg.status === 'sent' && <CheckCheck size={16} className="text-blue-200" />}
                            </>
                          )}
                      </div>
                    </div>

                    {isSender && (
                      <>
                        <button 
                          onClick={() => handleMenuToggle(msg.id)}
                          className="absolute -top-2 -left-3 p-1 rounded-full bg-white border text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        {openMessageMenu === msg.id && (
                          <div ref={menuRef} className="absolute top-full right-0 mt-1 z-10 w-40 bg-white border rounded-md shadow-lg">
                              <ul className="py-1">
                                  <li>
                                      <button
                                          onClick={() => confirmAndDelete(msg.id)}
                                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                      >
                                          <Trash2 className="w-4 h-4" />
                                          Delete
                                      </button>
                                  </li>
                              </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        ) : (
          !isLoadingMore && <div className="text-center text-gray-400 mt-20">No messages yet. Say hello!</div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}