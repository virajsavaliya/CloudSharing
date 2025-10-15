"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAbly } from 'ably/react';
import { getAuth } from "firebase/auth";

export const useChat = (myChatId, selectedUser) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const ablyClient = useAbly();

  const loadMessages = useCallback(async (cursor = null) => {
    if (!myChatId || !selectedUser?.chatId) return;

    if (!cursor) {
      setMessages([]);
      setHasMore(true);
    }
    
    setIsLoadingMore(true);
    let url = `/api/chat?user1=${myChatId}&user2=${selectedUser.chatId}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      
      if (data.messages.length < 25) {
        setHasMore(false);
      }
      
      const processedMessages = data.messages.map(m => ({...m, status: 'sent'}));
      setMessages(prev => cursor ? [...processedMessages, ...prev] : processedMessages);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [myChatId, selectedUser?.chatId]);


  useEffect(() => {
    loadMessages();
    setInput("");
    inputRef.current?.focus();
  }, [selectedUser?.chatId, loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleLoadMore = () => {
    if (messages.length > 0 && hasMore && !isLoadingMore) {
      loadMessages(messages[0].timestamp);
    }
  };

  const sendMessage = async (audioData = null, messageType = 'text') => {
    if (messageType === 'text' && !input.trim()) return;
    if (messageType === 'audio' && !audioData) return;
    if (!myChatId || !selectedUser) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
        console.error("User not authenticated to send message");
        return;
    }
    const token = await user.getIdToken();

    const chatId = [myChatId, selectedUser.chatId].sort().join('_');
    const timestamp = new Date().toISOString();

    // **THE FIX IS HERE**: Ensure the senderId is always the logged-in user's ID
    const messageData = {
      senderId: myChatId, // Use myChatId to guarantee it matches the authenticated user
      message: messageType === 'text' ? input.trim() : audioData,
      messageType: messageType, // Add message type
      timestamp: timestamp
    };

    const optimisticMessage = {
      ...messageData,
      id: Date.now().toString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const messageToSend = messageType === 'text' ? input : audioData;
    if (messageType === 'text') setInput("");

    try {
      const channel = ablyClient.channels.get(chatId);
      await channel.publish('chat-message', messageData);

      const receiverPrivateChannel = ablyClient.channels.get(`private-${selectedUser.chatId}`);
      await receiverPrivateChannel.publish('new-message-ping', {
          from: myChatId,
          message: messageType === 'text' ? messageToSend.trim() : '🎵 Audio message'
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...messageData, receiverId: selectedUser.chatId }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message to server");
      }

      setMessages(prev => prev.map(m =>
        m.id === optimisticMessage.id ? { ...m, status: 'sent' } : m
      ));

    } catch (error) {
      console.error("Failed to send message:", error);
      if (messageType === 'text') setInput(messageToSend);
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    }
  };
  
  const handleDeleteMessage = async (messageId) => {
    if (!myChatId || !selectedUser) return;
    const chatId = [myChatId, selectedUser.chatId].sort().join('_');
    
    const originalMessages = messages;
    setMessages(currentMessages => currentMessages.filter(msg => msg.id !== messageId));

    try {
        const channel = ablyClient.channels.get(chatId);
        await channel.publish('message-deleted', { messageId });
        
        await fetch(`/api/chat?chatId=${chatId}&messageId=${messageId}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.error("Failed to delete message:", error);
        setMessages(originalMessages);
    }
  };
  
  return { messages, setMessages, input, setInput, sendMessage, handleDeleteMessage, inputRef, messagesEndRef, isLoadingMore, handleLoadMore };
};