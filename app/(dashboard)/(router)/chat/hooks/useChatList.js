// app/(dashboard)/(router)/chat/hooks/useChatList.js
"use client";
import { useState, useEffect } from 'react';

export const useChatList = (myChatId) => {
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (myChatId) {
            const storedHistory = localStorage.getItem(`chatHistory_${myChatId}`);
            if (storedHistory) {
                try {
                    setChatHistory(JSON.parse(storedHistory));
                } catch (e) {
                    console.error("Failed to parse chat history from localStorage", e);
                    setChatHistory([]);
                }
            }
            setIsLoading(false);
        }
    }, [myChatId]);

    const saveHistory = (newHistory) => {
        setChatHistory(newHistory);
        if (myChatId) {
          localStorage.setItem(`chatHistory_${myChatId}`, JSON.stringify(newHistory));
        }
    };

    const addUserToHistory = (user) => {
        setChatHistory(currentHistory => {
            if (!currentHistory.some(u => u.chatId === user.chatId)) {
                const newHistory = [user, ...currentHistory];
                saveHistory(newHistory);
                return newHistory;
            }
            return currentHistory;
        });
    };

    const removeConversation = (chatIdToRemove) => {
        setChatHistory(currentHistory => {
            const newHistory = currentHistory.filter(user => user.chatId !== chatIdToRemove);
            saveHistory(newHistory);
            return newHistory;
        });
    };

    return { chatHistory, addUserToHistory, removeConversation, isLoading };
};