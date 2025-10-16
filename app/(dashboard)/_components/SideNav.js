import { File, Home, LucideHelpCircle, Shield, Trash2, Upload, Settings, Video, MessageSquare } from "lucide-react";
import Image from "next/image";
import React, { useMemo, useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { doc, setDoc, getDoc, getDocs, collection, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig"; 
import { useAuth } from "../../_utils/FirebaseAuthContext";
import { getAuth, updateProfile, updatePassword } from "firebase/auth";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import ProfileAvatar from "./ProfileAvatar";

const saveUserToFirebase = async (user) => {
  if (!user) return;
  const now = new Date();
  const userRef = doc(db, "users", user.uid);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    const usersQuery = query(collection(db, "users"), where("email", "==", user.email || ""));
    const usersSnap = await getDocs(usersQuery);

    if (!usersSnap.empty) {
      const oldDoc = usersSnap.docs[0];
      const oldData = oldDoc.data();
      await setDoc(userRef, {
        ...oldData,
        id: user.uid,
        email: user.email || "",
        username: user.displayName || "",
        firstName: user.displayName?.split(" ")[0] || "",
        lastName: user.displayName?.split(" ")[1] || "",
        createdAt: oldData.createdAt || now,
        lastLogin: now,
        role: oldData.role || "user"
      });
    } else {
      await setDoc(userRef, {
        id: user.uid,
        email: user.email || "",
        username: user.displayName || "",
        firstName: user.displayName?.split(" ")[0] || "",
        lastName: user.displayName?.split(" ")[1] || "",
        createdAt: now,
        lastLogin: now,
        role: "user"
      });
    }
  } else {
    await setDoc(userRef, { lastLogin: now }, { merge: true });
  }
};

function SideNav({ unreadChatCount = 0, isExpanded }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (user) {
      saveUserToFirebase(user);
      const fetchRole = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          setUserRole(userDoc.exists() ? userDoc.data().role : null);
        } catch (e) {
          setUserRole(null);
        }
      };
      fetchRole();
    }
  }, [user]);

  const menuList = useMemo(() => {
    const baseMenu = [
      { id: 1, name: "Home", icon: Home, path: "/" },
      { id: 2, name: "Files", icon: File, path: "/files" },
      { id: 3, name: "Upload", icon: Upload, path: "/upload" },
      { id: 8, name: "Meeting", icon: Video, path: "/meeting" },
      { id: 9, name: "Chat", icon: MessageSquare, path: "/chat" },
      { id: 5, name: "Recycle Bin", icon: Trash2, path: "/recycle" },
      ...(userRole === "admin" ? [] : [{ id: 4, name: "Upgrade", icon: Shield, path: "/upgrade" }]),
      { id: 6, name: "Help", icon: LucideHelpCircle, path: "/help" },
    ];
    if (userRole === "admin") {
      baseMenu.push({ id: 7, name: "Admin Panel", icon: Settings, path: "/admin" });
    }
    return baseMenu;
  }, [userRole]);

  const handleNavigation = (path) => router.push(path);

  return (
    <div className="shadow-lg border-r h-full w-full flex-col justify-between rounded-2xl bg-gradient-to-b from-white via-blue-50 to-white hidden md:flex">
      <div>
        {/* --- START OF LOGO CHANGE --- */}
        <div className="p-4 py-2 border-b h-[72px] flex items-center justify-center">
          {isExpanded ? (
            // Replace '/logo-full.svg' with the path to your big logo
            <Image src="/logo.svg" width={150} height={50} alt="Logo" />
          ) : (
            // Replace '/logo-icon.svg' with the path to your small logo
            <Image src="/logo_icon.svg" width={40} height={40} alt="Logo Icon" />
          )}
        </div>
        {/* --- END OF LOGO CHANGE --- */}
        <div className="flex flex-col float-left w-full mt-4">
          {menuList.map((item) => (
            <button
              key={item.id}
              className={`flex gap-4 items-center p-4 transition-all duration-300 ease-in-out hover:bg-gray-200 text-gray-700 rounded-lg ${
                pathname === item.path ? "bg-blue-100 text-primary" : ""
              } ${isExpanded ? 'px-6' : 'justify-center'}`}
              onClick={() => handleNavigation(item.path)}
            >
              <div className={`relative ${pathname === item.path ? "text-blue-600" : ""}`}>
                <item.icon className="h-6 w-6" />
                {item.name === "Chat" && unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 shadow">
                    {unreadChatCount > 99 ? "99+" : unreadChatCount}
                  </span>
                )}
              </div>
              {isExpanded && (
                <h2 className="font-medium flex items-center gap-1 whitespace-nowrap">
                  {item.name}
                  {(item.name === "Meeting" || item.name === "Chat") && (
                    <span className="text-[10px] font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-500 px-1.5 py-0.5 rounded uppercase tracking-wider">Beta</span>
                  )}
                </h2>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 border-t bg-gradient-to-r from-white via-blue-50 to-white rounded-b-2xl">
        {user && (
          <div className="flex items-center gap-3 relative">
            <div 
              className={`flex items-center gap-2 cursor-pointer group w-full ${!isExpanded && 'justify-center'}`} 
              onClick={() => setShowMenu((v) => !v)} tabIndex={0} onBlur={() => setTimeout(() => setShowMenu(false), 200)}
            >
              <ProfileAvatar user={user} size={32} />
              {isExpanded && (
                <>
                  <span className="text-gray-900 font-semibold transition-all duration-200 truncate font-sans text-sm" title={user.displayName || user.email}>
                    {user.displayName || user.email}
                  </span>
                  <svg className="w-5 h-5 ml-auto text-gray-400 group-hover:text-blue-500 transition" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"></path></svg>
                </>
              )}
            </div>
            {showMenu && (
              <div className="absolute bottom-16 left-0 bg-white border rounded-xl shadow-xl z-50 min-w-[210px] animate-fade-in flex flex-col">
                <button className="block w-full text-left px-5 py-3 hover:bg-blue-50 font-medium text-gray-700 rounded-t-xl" onClick={() => { router.push("/settings"); setShowMenu(false); }}>
                  <span className="flex items-center gap-2"><svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>Settings</span>
                </button>
                <button className="block w-full text-left px-5 py-3 hover:bg-gray-100 font-medium text-red-600 rounded-b-xl border-t" onClick={logout}>Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; transform: scale(0.95);} to { opacity: 1; transform: scale(1);} }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}

export default SideNav;