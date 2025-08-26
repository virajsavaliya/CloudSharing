// app/(dashboard)/(router)/chat/page.js
"use client";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../../_utils/FirebaseAuthContext";
import { db } from "../../../../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Image from "next/image";
import { AblyProvider, ChannelProvider, useAbly } from 'ably/react';
import * as Ably from 'ably';
import Link from "next/link";
// --- Start of New Code ---
import { useRouter, usePathname } from "next/navigation"; // Import navigation hooks
// --- End of New Code ---

import Sidebar from "./_components/Sidebar";
import ChatRoom from "./_components/ChatRoom";
import AddIdModal from "./_components/AddIdModal";
import Toast from "./_components/Toast";
import { useChatList } from "./hooks/useChatList";

async function setupUserChatProfile(user) {
  if (!user?.uid) return null;
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists() && userSnap.data().chatId) {
    return userSnap.data().chatId;
  }
  const base = (user.displayName || user.email.split("@")[0]).replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
  const newChatId = `${base}${Math.floor(100 + Math.random() * 900)}`;
  await setDoc(userRef, {
    chatId: newChatId,
    displayName: user.displayName || null,
    email: user.email || null,
    photoURL: user.photoURL || null,
    uid: user.uid
  }, { merge: true });
  return newChatId;
}

const GlobalMessageListener = ({ myChatId, chatHistory, addUserToHistory, setToastMessage }) => {
    const ablyClient = useAbly();

    useEffect(() => {
        if (!myChatId) return;

        const channel = ablyClient.channels.get(`private-${myChatId}`);
        
        const listener = async (message) => {
            const senderId = message.data.from;
            const messageBody = message.data.message;
            const isAlreadyInHistory = chatHistory.some(user => user.chatId === senderId);
            
            if (!isAlreadyInHistory && senderId) {
                try {
                    const response = await fetch(`/api/find-user?chatId=${senderId}`);
                    const data = await response.json();
                    if (response.ok && data.user) {
                        const senderProfile = data.user;
                        addUserToHistory(senderProfile);
                        setToastMessage(`New message from ${senderProfile.displayName || senderId}`);

                        if (document.hidden && Notification.permission === 'granted') {
                            const notification = new Notification(`New message from ${senderProfile.displayName || senderId}`, {
                                body: messageBody,
                                icon: senderProfile.photoURL || '/logo.svg'
                            });
                            notification.onclick = () => window.focus();
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch new user profile:', error);
                }
            } else if (senderId) {
                const senderProfile = chatHistory.find(user => user.chatId === senderId);
                if (document.hidden && Notification.permission === 'granted' && senderProfile) {
                     const notification = new Notification(`New message from ${senderProfile.displayName || senderId}`, {
                        body: messageBody,
                        icon: senderProfile.photoURL || '/logo.svg'
                    });
                    notification.onclick = () => window.focus();
                }
            }
        };

        channel.subscribe('new-message-ping', listener);

        return () => {
            channel.unsubscribe('new-message-ping', listener);
        };
    }, [myChatId, ablyClient, chatHistory, addUserToHistory, setToastMessage]);

    return null;
};


function ChatInterface({ user, myChatId }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const { chatHistory, addUserToHistory, removeConversation } = useChatList(myChatId);
  const [toastMessage, setToastMessage] = useState(null);
  const [showAddId, setShowAddId] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);


  const handleConnectAndSend = (foundUser) => {
    if (!foundUser || foundUser.chatId === myChatId) {
      setToastMessage("Invalid user or cannot chat with yourself.");
      return;
    }
    addUserToHistory(foundUser);
    setSelectedUser(foundUser);
    setShowAddId(false);
    setToastMessage(`Conversation with ${foundUser.displayName || foundUser.chatId} started!`);
  };

  const handleDeleteConversation = async (chatIdToDelete) => {
    if (!window.confirm("Are you sure you want to permanently delete this user and the entire conversation? This action cannot be undone.")) return;

    const fullChatId = [myChatId, chatIdToDelete].sort().join('_');
    
    try {
        const response = await fetch(`/api/chat/conversation?chatId=${fullChatId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error("Failed to delete conversation on the server.");
        }

        removeConversation(chatIdToDelete);

        if (selectedUser?.chatId === chatIdToDelete) {
            setSelectedUser(null);
        }
        setToastMessage("Conversation deleted.");
    } catch (error) {
        console.error("Error deleting conversation:", error);
        setToastMessage("Could not delete conversation.");
    }
  };

  const handleClearMessages = async (chatIdToClear) => {
    if (!window.confirm("Are you sure you want to clear all messages in this conversation? This will not delete the user from your list.")) return;
    
    const fullChatId = [myChatId, chatIdToClear].sort().join('_');

    try {
        const response = await fetch(`/api/chat/messages?chatId=${fullChatId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error("Failed to clear messages on the server.");
        }

        if (selectedUser?.chatId === chatIdToClear) {
            const currentUser = selectedUser;
            setSelectedUser(null);
            setTimeout(() => setSelectedUser(currentUser), 0);
        }
        setToastMessage("Messages cleared successfully.");
    } catch(error) {
        console.error("Error clearing messages:", error);
        setToastMessage("Could not clear messages.");
    }
  };

  const channelName = selectedUser ? [myChatId, selectedUser.chatId].sort().join('_') : null;

  return (
    <div className="flex h-full w-full bg-white rounded-lg shadow-md overflow-hidden border">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      
      <GlobalMessageListener 
        myChatId={myChatId} 
        chatHistory={chatHistory} 
        addUserToHistory={addUserToHistory}
        setToastMessage={setToastMessage}
      />

      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-auto`}>
        <Sidebar
          myChatId={myChatId}
          chatHistory={chatHistory}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          setShowAddId={setShowAddId}
          setToastMessage={setToastMessage}
        />
      </div>

      <div className={`flex-1 ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser && channelName ? (
          <ChannelProvider channelName={channelName}>
            <ChatRoom
              myChatId={myChatId}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              handleClearMessages={handleClearMessages}
              handleDeleteConversation={handleDeleteConversation}
            />
          </ChannelProvider>
        ) : (
          <main className="hidden md:flex flex-1 flex-col items-center justify-center text-center text-gray-500 bg-white h-full">
            <Image src="/logo.svg" width={150} height={100} alt="Logo" className="mb-4" />
            <p className="text-lg font-semibold">Welcome to your Secure Chat</p>
            <p>Select a conversation or add a new user to begin.</p>
          </main>
        )}
      </div>

      <AddIdModal
        show={showAddId}
        onClose={() => setShowAddId(false)}
        onConnectAndSend={handleConnectAndSend}
        myChatId={myChatId}
      />
    </div>
  );
}
// NavLocation Component
const NavLocation = () => {
  return (
    <div className="md:block pb-4">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1 text-sm text-gray-600">
          <li>
            <Link href="/" className="block transition hover:text-gray-700">
              <span className="sr-only"> Home </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </Link>
          </li>
          <li className="rtl:rotate-180">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </li>
          <li>
            <Link
              href="/chat"
              className="block transition hover:text-gray-700"
            >
              {" "}
              Chat{" "}
            </Link>
          </li>
        </ol>
      </nav>
    </div>
  );
};

export default function Page() {
  const { user, loading: authLoading } = useAuth();
  const [myChatId, setMyChatId] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  // --- Start of New Code ---
  const router = useRouter();
  const pathname = usePathname();
  // --- End of New Code ---

  useEffect(() => {
    // If auth is done loading and there is a user, setup their profile.
    if (!authLoading && user) {
      setIsProfileLoading(true);
      setupUserChatProfile(user)
        .then(setMyChatId)
        .finally(() => setIsProfileLoading(false));
    } 
    // **THE FIX IS HERE**: If auth is done loading and there is NO user, redirect to login.
    else if (!authLoading && !user) {
      router.push(`/login?redirect_url=${encodeURIComponent(pathname)}`);
    }
  }, [user, authLoading, router, pathname]);

  const ablyClient = useMemo(() => {
    if (myChatId) {
      return new Ably.Realtime({ authUrl: `/api/ably-token?clientId=${myChatId}` });
    }
    return null;
  }, [myChatId]);

  // The loading skeleton will show while auth is loading or the user is being redirected.
  if (authLoading || isProfileLoading || !ablyClient) {
  return (
    <div className="p-4 md:p-6 w-full h-[calc(100vh-65px)] bg-gray-50">
      <NavLocation />

      <div className="flex h-full border rounded-lg overflow-hidden shadow-sm">
        <div className="hidden md:flex flex-col w-80 lg:w-96 bg-white border-r animate-pulse">
          <div className="p-4 border-b h-28 bg-gray-200"></div>
          <div className="p-4 border-b h-24 bg-gray-200"></div>
          <div className="flex-1 space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-white animate-pulse">
          <div className="h-[73px] border-b bg-gray-200"></div>
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-${i % 2 === 0 ? "3/4" : "1/2"} h-8 bg-gray-200 rounded ${i % 2 !== 0 && 'ml-auto'}`}
              ></div>
            ))}
          </div>
          <div className="h-[73px] border-t bg-gray-200"></div>
        </div>
      </div>
    </div>
  );
}

  // If the user is logged in and everything is loaded, show the chat interface.
  return (
    <div className="p-4 md:p-6 w-full h-[calc(100vh-65px)]">
      <NavLocation />
      <AblyProvider client={ablyClient}>
        <ChatInterface user={user} myChatId={myChatId} />
      </AblyProvider>
    </div>
  );
}