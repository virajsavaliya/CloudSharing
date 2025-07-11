"use client";
import { useEffect, useState, useRef, useCallback, memo } from "react";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../../../_utils/FirebaseAuthContext";
import { db } from "../../../../firebaseConfig";
import { doc, getDoc, getDocs, collection, setDoc, onSnapshot, query, orderBy, getDocs as getDocsFirestore, updateDoc, arrayUnion, deleteDoc } from "firebase/firestore";
import Image from "next/image";
// Import components from _components
import Sidebar from "./_components/Sidebar";
import ChatHeader from "./_components/ChatHeader";
import ChatMessages from "./_components/ChatMessages";
import ChatInput from "./_components/ChatInput";
import AddIdModal from "./_components/AddIdModal";
import Toast from "./_components/Toast";

// Ensure user has a unique chatId in Firestore
async function ensureChatId(user) {
  if (!user) return null;
  const userRef = doc(db, "users", user.uid);
  let userSnap = await getDoc(userRef);
  let data = userSnap.exists() ? userSnap.data() : {};
  if (data.chatId) {
    return data.chatId;
  }
  // Generate a user-friendly chatId: username + random 3-digit number
  let base = (user.displayName || user.email || "user").split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  if (base.length > 10) base = base.slice(0, 10);
  const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit number
  const newChatId = `${base}${randomNum}`;
  await setDoc(userRef, { chatId: newChatId }, { merge: true });
  // Re-fetch to ensure it's stored
  userSnap = await getDoc(userRef);
  data = userSnap.exists() ? userSnap.data() : {};
  return data.chatId || newChatId;
}

// Memoized UserAvatar for performance
const UserAvatar = memo(({ user, size = 40, fallbackBg = "bg-blue-100", fallbackTextColor = "text-blue-700", fallback = "U" }) => {
  if (user?.photoURL) {
    return (
      <Image
        src={user.photoURL}
        alt={user.displayName || user.email || "User"}
        width={size}
        height={size}
        className="rounded-full object-cover shadow-sm"
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      />
    );
  }
  const text = user?.displayName
    ? user.displayName[0].toUpperCase()
    : (user?.email ? user.email[0].toUpperCase() : fallback);
  return (
    <div
      className={`${fallbackBg} flex items-center justify-center font-bold ${fallbackTextColor} rounded-full shadow-sm`}
      style={{ width: size, height: size, minWidth: size, minHeight: size, fontSize: size * 0.5 }}
    >
      {text}
    </div>
  );
});

function ChatPage() {
  const { user } = useAuth();
  const [chatId, setChatId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [otherId, setOtherId] = useState("");
  const [idError, setIdError] = useState("");
  const [chatHistory, setChatHistory] = useState([]); // [{chatId, displayName, email}]
  const [unreadCounts, setUnreadCounts] = useState({}); // {chatId: count}
  const messagesEndRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [showAddId, setShowAddId] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(); // <-- add this line
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Sidebar (chat list) visibility for mobile
  const [showSidebar, setShowSidebar] = useState(true);

  // When a chat is selected on mobile, hide sidebar
  useEffect(() => {
    if (isMobile && selectedUser) setShowSidebar(false);
    if (isMobile && !selectedUser) setShowSidebar(true);
  }, [isMobile, selectedUser]);

  // Ensure chatId on mount
  useEffect(() => {
    if (user) {
      ensureChatId(user).then(setChatId);
    }
  }, [user]);

  // Load chat history from localStorage and Firestore (merge both)
  useEffect(() => {
    if (!chatId) return;
    const history = localStorage.getItem(`chatHistory_${chatId}`);
    let localHistory = [];
    if (history) {
      localHistory = JSON.parse(history);
      setChatHistory(localHistory);
    }
    // --- NEW: Merge Firestore chatHistory (if present) ---
    const fetchFirestoreHistory = async () => {
      const userRef = doc(db, "users", chatId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.chatHistory)) {
          // Merge unique users from Firestore chatHistory
          const merged = [
            ...data.chatHistory,
            ...localHistory.filter(
              lh => !data.chatHistory.some(fh => fh.chatId === lh.chatId)
            ),
          ];
          setChatHistory(merged);
          localStorage.setItem(`chatHistory_${chatId}`, JSON.stringify(merged));
        }
      }
    };
    fetchFirestoreHistory();
  }, [chatId]);

  // Save chat history to localStorage
  const saveChatHistory = (history) => {
    if (!chatId) return;
    setChatHistory(history);
    localStorage.setItem(`chatHistory_${chatId}`, JSON.stringify(history));
  };

  // Add user to chat history if not present
  const addToChatHistory = (userObj) => {
    if (!userObj || !userObj.chatId || userObj.chatId === chatId) return;
    const exists = chatHistory.some((u) => u.chatId === userObj.chatId);
    if (!exists) {
      const newHistory = [
        {
          chatId: userObj.chatId,
          displayName: userObj.displayName,
          email: userObj.email,
          photoURL: userObj.photoURL || null, // store photoURL
        },
        ...chatHistory,
      ];
      saveChatHistory(newHistory);
    }
  };

  // Track if user is at bottom of chat (for scroll control)
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Handler to update isAtBottom when user scrolls
  const scrollTimeout = useRef();
  const handleChatScroll = (e) => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < 120);
    }, 50);
  };

  // Add error state for chat API errors
  const [chatApiError, setChatApiError] = useState("");

  // --- Firebase real-time chat listener ---
  useEffect(() => {
    if (!chatId || !selectedUser) return;
    setChatApiError(""); // reset error before fetch

    // Assume messages are stored in a collection: chats/{chatId1_chatId2}/messages
    // Sort chatId1 and chatId2 lexicographically to ensure unique path
    const chatKey = [chatId, selectedUser.chatId].sort().join("_");
    const messagesRef = collection(db, "chats", chatKey, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach(doc => {
        msgs.push(doc.data());
      });
      setMessages(msgs);
      setChatApiError(""); // clear error if successful
    }, (err) => {
      setChatApiError("Failed to load messages.");
      setMessages([]);
    });

    return () => unsubscribe();
    // eslint-disable-next-line
  }, [chatId, selectedUser]);

  // Scroll to bottom on new message, but only if user is at the bottom
  useEffect(() => {
    if (!messagesEndRef.current) return;
    if (isAtBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  // Send message: write to Firestore
  const sendMessage = async () => {
    if (!input.trim() || !selectedUser) return;
    const msg = {
      senderId: chatId,
      receiverId: selectedUser.chatId,
      message: input,
      timestamp: new Date().toISOString(),
    };
    setInput("");
    // Write to Firestore
    const chatKey = [chatId, selectedUser.chatId].sort().join("_");
    const messagesRef = collection(db, "chats", chatKey, "messages");
    await setDoc(doc(messagesRef), msg);
    addToChatHistory(selectedUser);

    // --- Add receiver to sender's chatHistory in Firestore if not present ---
    try {
      const userRef = doc(db, "users", chatId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        const chatHistory = data.chatHistory || [];
        const alreadyExists = chatHistory.some(u => u.chatId === selectedUser.chatId);
        if (!alreadyExists) {
          const newEntry = {
            chatId: selectedUser.chatId,
            displayName: selectedUser.displayName || selectedUser.email || "",
            email: selectedUser.email || "",
            photoURL: selectedUser.photoURL || null,
          };
          await updateDoc(userRef, {
            chatHistory: arrayUnion(newEntry)
          });
        }
      }
    } catch (e) {
      // ignore error, not critical for sending message
    }

    // --- Add sender to receiver's chatHistory if not present ---
    try {
      const receiverRef = doc(db, "users", selectedUser.chatId);
      const receiverSnap = await getDoc(receiverRef);
      if (receiverSnap.exists()) {
        const receiverData = receiverSnap.data();
        const receiverChatHistory = receiverData.chatHistory || [];
        const senderExists = receiverChatHistory.some(u => u.chatId === chatId);
        if (!senderExists) {
          // Get sender info from Firestore for accurate displayName/photoURL
          let senderInfo = user;
          if (!senderInfo || !senderInfo.displayName || !senderInfo.photoURL) {
            const senderDoc = await getDoc(doc(db, "users", chatId));
            if (senderDoc.exists()) {
              senderInfo = { ...senderDoc.data(), ...senderInfo };
            }
          }
          const senderEntry = {
            chatId: chatId,
            displayName: senderInfo.displayName || senderInfo.email || "",
            email: senderInfo.email || "",
            photoURL: senderInfo.photoURL || null,
          };
          await updateDoc(receiverRef, {
            chatHistory: arrayUnion(senderEntry)
          });
        }
      }
    } catch (e) {
      // ignore error, not critical for sending message
    }
    // No need to manually fetch messages, listener will update
  };

  // Handle connect by chatId
  const handleConnectById = async () => {
    setIdError("");
    if (!otherId.trim()) return;
    if (otherId === chatId) {
      setIdError("You cannot chat with yourself.");
      return;
    }
    // Try to find user by chatId
    const snap = await getDocs(collection(db, "users"));
    const found = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .find((u) => u.chatId === otherId);
    if (found) {
      setSelectedUser(found);
      setIdError("");
      addToChatHistory(found);
    } else {
      setIdError("No user found with this ID.");
    }
  };

  // Helper to get latest user info from Firestore by chatId
  const getUserByChatId = async (chatId) => {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .find((u) => u.chatId === chatId);
  };

  // When selecting from chat history, always fetch latest info (including photoURL)
  const handleSelectHistoryUser = async (historyUser) => {
    if (!historyUser || !historyUser.chatId) return;
    const found = await getUserByChatId(historyUser.chatId);
    if (found) {
      setSelectedUser(found);
      setIdError("");
      addToChatHistory(found);
    } else {
      setSelectedUser(historyUser);
      setIdError("");
    }
  };

  // Helper: update last read timestamp in Firestore
  const updateLastRead = async (myChatId, otherChatId) => {
    if (!myChatId || !otherChatId) return;
    const chatKey = [myChatId, otherChatId].sort().join("_");
    const lastReadRef = doc(db, "chats", chatKey, "lastRead", myChatId);
    await setDoc(lastReadRef, { timestamp: new Date().toISOString() }, { merge: true });
  };

  // --- Unread message count using Firestore ---
  useEffect(() => {
    if (!chatId || chatHistory.length === 0) return;

    let unsubscribes = [];

    chatHistory.forEach((chat) => {
      if (!chat.chatId) return;
      const chatKey = [chatId, chat.chatId].sort().join("_");
      const messagesRef = collection(db, "chats", chatKey, "messages");
      const lastReadRef = doc(db, "chats", chatKey, "lastRead", chatId);

      // Listen for lastRead timestamp
      let lastReadTs = null;
      const unsubLastRead = onSnapshot(lastReadRef, (snap) => {
        lastReadTs = snap.exists() ? snap.data().timestamp : null;
        // Listen for messages
        const unsubMsgs = onSnapshot(messagesRef, (snapshot) => {
          let unread = 0;
          snapshot.forEach(docSnap => {
            const msg = docSnap.data();
            if (
              msg.senderId === chat.chatId &&
              (!lastReadTs || new Date(msg.timestamp) > new Date(lastReadTs))
            ) {
              unread++;
            }
          });
          setUnreadCounts(prev => ({ ...prev, [chat.chatId]: unread }));
        });
        unsubscribes.push(unsubMsgs);
      });
      unsubscribes.push(unsubLastRead);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub && unsub());
    };
    // eslint-disable-next-line
  }, [chatId, chatHistory]);

  // --- Mark messages as read when opening a chat (update Firestore) ---
  useEffect(() => {
    if (!chatId || !selectedUser) return;
    updateLastRead(chatId, selectedUser.chatId);
    setUnreadCounts((prev) => ({ ...prev, [selectedUser.chatId]: 0 }));
    // eslint-disable-next-line
  }, [chatId, selectedUser]);

  // --- Place ALL hooks at the top level, before any early return! ---
  const syncChatsFromFirestore = useCallback(async () => {
    if (!chatId) return;
    // Get all chat collections under "chats"
    const chatsSnap = await getDocsFirestore(collection(db, "chats"));
    const chatKeys = chatsSnap.docs.map(docSnap => docSnap.id);
    let newUsers = [];
    for (const key of chatKeys) {
      if (!key.includes(chatId)) continue;
      const ids = key.split("_");
      const otherId = ids[0] === chatId ? ids[1] : ids[0];
      if (otherId === chatId) continue;
      // If not already in chatHistory, add
      if (!chatHistory.some(u => u.chatId === otherId)) {
        // Fetch user info
        const usersSnap = await getDocsFirestore(collection(db, "users"));
        const found = usersSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .find((u) => u.chatId === otherId);
        if (found) {
          newUsers.push({
            chatId: found.chatId,
            displayName: found.displayName,
            email: found.email,
            photoURL: found.photoURL || null,
          });
        }
      }
    }
    if (newUsers.length > 0) {
      // Add new users to chatHistory and save
      const newHistory = [...newUsers, ...chatHistory];
      setChatHistory(newHistory);
      localStorage.setItem(`chatHistory_${chatId}`, JSON.stringify(newHistory));
    }
  }, [chatId, chatHistory]);

  // On chatId or chatHistory change, sync chats from Firestore
  useEffect(() => {
    syncChatsFromFirestore();
    // eslint-disable-next-line
  }, [chatId]);

  // --- DO NOT put any early return before all hooks! ---
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (chatApiError) {
      setToast(chatApiError);
      setTimeout(() => setToast(null), 2500);
    }
  }, [chatApiError]);

  // Move this block AFTER all hooks:
  if (!user || !chatId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Image
          src="/loader.gif"
          alt="Loading..."
          width={350}
          height={350}
          className="w-100 h-100"
        />
      </div>
    );
  }

  // Add this function before your component return
  const handleDeleteHistoryUser = (chatIdToDelete) => {
    const newHistory = chatHistory.filter(u => u.chatId !== chatIdToDelete);
    saveChatHistory(newHistory);
    setUnreadCounts(prev => {
      const copy = { ...prev };
      delete copy[chatIdToDelete];
      return copy;
    });
    if (selectedUser?.chatId === chatIdToDelete) setSelectedUser(null);
  };

  // Add this function before your component return (if not already present)
  const handleDeleteChatWithUser = async (otherChatId) => {
    if (!chatId || !otherChatId) return;
    if (!window.confirm("Are you sure you want to delete all chat messages with this user? This cannot be undone.")) return;
    try {
      // Try deleting chat messages from Firestore directly (client-side fallback)
      const chatKey = [chatId, otherChatId].sort().join("_");
      // Delete all messages in chats/{chatKey}/messages
      const messagesRef = collection(db, "chats", chatKey, "messages");
      const messagesSnap = await getDocs(messagesRef);
      const batchDeletes = [];
      messagesSnap.forEach(docSnap => {
        batchDeletes.push(deleteDoc(docSnap.ref));
      });
      await Promise.all(batchDeletes);

      // Optionally, delete lastRead docs
      const lastReadRef1 = doc(db, "chats", chatKey, "lastRead", chatId);
      const lastReadRef2 = doc(db, "chats", chatKey, "lastRead", otherChatId);
      await Promise.all([deleteDoc(lastReadRef1), deleteDoc(lastReadRef2)]);

      if (selectedUser?.chatId === otherChatId) setMessages([]);
      setUnreadCounts(prev => {
        const copy = { ...prev };
        delete copy[otherChatId];
        return copy;
      });
      const newHistory = chatHistory.filter(u => u.chatId !== otherChatId);
      saveChatHistory(newHistory);
      if (selectedUser?.chatId === otherChatId) setSelectedUser(null);
    } catch (e) {
      setToast("Failed to delete chat messages.");
    }
  };

  // Define handleCopyChatId here
  const handleCopyChatId = () => {
    if (chatId) {
      navigator.clipboard.writeText(chatId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <div
      className="w-full h-screen flex bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden font-sans"
      aria-label="Chat Application"
      tabIndex={0}
      style={{
        ...(isMobile && showSidebar
          ? { position: "fixed", width: "100vw", height: "100vh", overflow: "hidden" }
          : {}),
        ...(isMobile && !showSidebar
          ? { position: "fixed", width: "100vw", height: "100vh", overflow: "hidden" }
          : {}),
      }}
    >
      <Toast toast={toast} />
      <Sidebar
        chatId={chatId}
        chatHistory={chatHistory}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        unreadCounts={unreadCounts}
        handleCopyChatId={handleCopyChatId}
        copied={copied}
        handleDeleteHistoryUser={handleDeleteHistoryUser}
        handleDeleteChatWithUser={handleDeleteChatWithUser}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        showAddId={showAddId}
        setShowAddId={setShowAddId}
        otherId={otherId}
        setOtherId={setOtherId}
        handleConnectById={handleConnectById}
        idError={idError}
        isMobile={isMobile}
      />
      <main
        className={`
          flex-1 flex flex-col h-full relative bg-gradient-to-br from-blue-100 to-blue-200
          ${isMobile && showSidebar ? "hidden" : ""}
          ${isMobile ? "fixed left-0 right-0 top-0 z-30 w-full h-full" : ""}
        `}
        style={{
          ...(isMobile
            ? {
              height: "100vh",
              maxHeight: "100vh",
              minHeight: "100vh",
              padding: "0px",
              borderRadius: "0px",
              overflow: "hidden",
            }
            : {
              height: "100vh",
              maxHeight: "100vh",
            }),
        }}
        aria-label="Chat Area"
        tabIndex={0}
      >
        {/* Fix: Add extra top padding for mobile so ChatHeader is not overlapped */}
        <div style={{
          paddingTop: isMobile ? "64px" : "0px",
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}>
          <ChatHeader
            selectedUser={selectedUser}
            isMobile={isMobile}
            setSelectedUser={setSelectedUser}
            setShowSidebar={setShowSidebar}
          />
          <div
            className={`flex-1 flex flex-col justify-end overflow-y-auto`}
            style={{
              minHeight: 0,
              maxHeight: "100%",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              flexGrow: 1,
              flexShrink: 1,
              display: "flex",
              flexDirection: "column",
              padding: isMobile ? "8px 0px" : "16px 32px",
            }}
          >
            <ChatMessages
              chatApiError={chatApiError}
              selectedUser={selectedUser}
              messages={messages}
              chatId={chatId}
              user={user}
              messagesEndRef={messagesEndRef}
              handleChatScroll={handleChatScroll}
            />
          </div>
          <div
            style={{
              width: "100%",
              position: "sticky",
              bottom: 0,
              zIndex: 20,
              background: isMobile ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.90)",
              borderTop: "1px solid #e5e7eb",
              padding: isMobile ? "8px 0px" : "16px 32px",
              boxShadow: isMobile ? "0 -2px 8px rgba(0,0,0,0.04)" : undefined,
            }}
          >
            <ChatInput
              selectedUser={selectedUser}
              input={input}
              setInput={setInput}
              sendMessage={sendMessage}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              inputRef={inputRef}
            />
          </div>
        </div>
        {isMobile && !showSidebar && !selectedUser && (
          <button
            className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center text-3xl shadow-lg z-50"
            onClick={() => setShowSidebar(true)}
            aria-label="Show chat list"
            title="Show chat list"
            style={{
              width: 56,
              height: 56,
              fontSize: 32,
              borderRadius: "50%",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            }}
          >
            <span>☰</span>
          </button>
        )}
      </main>
      <AddIdModal
        showAddId={showAddId}
        setShowAddId={setShowAddId}
        otherId={otherId}
        setOtherId={setOtherId}
        handleConnectById={handleConnectById}
        idError={idError}
      />
      {/* Modern style tweaks */}
      <style jsx>{`
        @media (max-width: 767px) {
          .w-[340px] {
            width: 100vw !important;
          }
          aside {
            min-width: 0 !important;
            max-width: 100vw !important;
            border-radius: 0 !important;
          }
          main {
            border-radius: 0 !important;
            padding: 0 !important;
            top: 0 !important;
          }
          .chat-bubble-user {
            background: linear-gradient(90deg, #2563eb 60%, #60a5fa 100%);
            color: #fff;
            border-radius: 18px 18px 4px 18px;
            font-size: 15px;
            padding: 10px 14px;
            margin-bottom: 2px;
            word-break: break-word;
          }
          .chat-bubble-bot {
            background: #fff;
            color: #222;
            border-radius: 18px 18px 18px 4px;
            font-size: 15px;
            padding: 10px 14px;
            margin-bottom: 2px;
            word-break: break-word;
            border: 1px solid #e5e7eb;
          }
          .faq-section {
            padding: 0;
          }
          .faq-title {
            font-size: 15px;
            margin-bottom: 6px;
          }
          .faq-button {
            font-size: 14px;
            padding: 8px 10px;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95);}
          to { opacity: 1; transform: scale(1);}
        }
        aside, main {
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
        }
        /* Tooltip styles */
        [title] {
          position: relative;
        }
        [title]:hover::after {
          content: attr(title);
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          background: #222;
          color: #fff;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 100;
        }
      `}</style>
    </div>
  );
}

// Helper icon for time
function ClockIcon() {
  return <svg className="w-3 h-3 inline-block mr-1 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
}

// Add these helper functions above all components so they are available everywhere
function shortId(id) {
  if (!id) return "";
  if (id.length <= 12) return id;
  return id.slice(0, 6) + "..." + id.slice(-4);
}

function shortName(name, maxLen = 18) {
  if (!name) return "";
  return name.length > maxLen ? name.slice(0, maxLen - 3) + "..." : name;
}

export default ChatPage;