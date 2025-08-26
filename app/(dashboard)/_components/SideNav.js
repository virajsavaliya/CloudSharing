import { File, Home, LucideHelpCircle, Shield, Trash2, Upload, Settings, Video, MessageSquare } from "lucide-react";
import Image from "next/image";
import React, { useMemo, useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { doc, setDoc, getDoc, getDocs, collection, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db, deleteAllUserData } from "../../../firebaseConfig"; 
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
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [username, setUsername] = useState(user?.displayName || "");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profilePicLoading, setProfilePicLoading] = useState(false);
  const [profilePicSuccess, setProfilePicSuccess] = useState(false);
  const fileInputRef = useRef();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const initialUsername = React.useRef(user?.displayName || "").current;
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await deleteAllUserData(user.uid, user.email);
      await getAuth().currentUser.reload();
      await getAuth().currentUser.delete();
      router.replace("/");
    } catch (e) {
      if (e.code === "auth/requires-recent-login") {
        alert("For security, please log out and log in again, then try deleting your account.");
      } else {
        alert("Failed to delete account. Please re-login and try again.");
      }
    }
  };

  const handleAccountFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!username) {
      setFormError("Username is required.");
      return;
    }
    if (password && password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    setUsernameLoading(true);
    setPasswordLoading(true);
    try {
      const auth = getAuth();
      if (username !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName: username });
        await setDoc(doc(db, "users", user.uid), { username, displayName: username }, { merge: true });
      }
      if (password) {
        await updatePassword(auth.currentUser, password);
      }
      setFormSuccess("Account updated successfully!");
      setTimeout(() => setFormSuccess(""), 2000);
      setPassword("");
      setConfirmPassword("");
    } catch (e) {
      setFormError("Failed to update account. Please re-login and try again.");
    }
    setUsernameLoading(false);
    setPasswordLoading(false);
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setProfilePicLoading(true);
    try {
      const storage = getStorage();
      const picRef = storageRef(storage, `profile-pictures/${user.uid}`);
      await uploadBytes(picRef, file);
      const url = await getDownloadURL(picRef);
      await updateProfile(getAuth().currentUser, { photoURL: url });
      await setDoc(doc(db, "users", user.uid), { photoURL: url }, { merge: true });
      setProfilePicSuccess(true);
      setTimeout(() => setProfilePicSuccess(false), 1500);
    } catch (e) {
      alert("Failed to update profile picture.");
    }
    setProfilePicLoading(false);
  };

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
                <button className="block w-full text-left px-5 py-3 hover:bg-blue-50 font-medium text-gray-700 rounded-t-xl" onClick={() => { setShowAccountModal(true); setShowMenu(false); }}>
                  <span className="flex items-center gap-2"><svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>Manage Account</span>
                </button>
                <button className="block w-full text-left px-5 py-3 hover:bg-gray-100 font-medium text-red-600 rounded-b-xl border-t" onClick={logout}>Logout</button>
              </div>
            )}
            {showAccountModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
                <div className="relative w-full max-w-md rounded-xl shadow-2xl animate-slide-up glass-card border border-blue-300 overflow-hidden">
                  <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-400 to-blue-300 p-6 pb-3">
                    <button className="absolute top-3 right-3 text-white text-2xl hover:text-blue-200 transition" onClick={() => setShowAccountModal(false)} aria-label="Close">&times;</button>
                    <div className="mb-2 relative group">
                      <ProfileAvatar user={user} size={64} />
                      <button type="button" className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 shadow transition flex items-center justify-center" style={{ width: 28, height: 28 }} onClick={() => fileInputRef.current?.click()} disabled={profilePicLoading} title="Change profile picture"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" /></svg></button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} disabled={profilePicLoading} />
                      {profilePicLoading && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-blue-100">Uploading...</span>}
                      {profilePicSuccess && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-green-200">Updated!</span>}
                    </div>
                    <div className="text-white font-bold text-base mb-1">{user.displayName || "User"}</div>
                    <div className="text-blue-100 text-xs">{user.email}</div>
                  </div>
                  <div className="p-6 pt-4 glass-form-section overflow-y-auto max-h-[calc(100vh-200px)]">
                    <form className="flex flex-col gap-5" onSubmit={handleAccountFormSubmit} autoComplete="off">
                      <div>
                        <label className="block text-xs font-semibold mb-2 text-blue-700 uppercase tracking-wide">Username</label>
                        <input type="text" className="border border-blue-200 rounded-lg px-4 py-2 w-full bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base transition" value={username} onChange={e => setUsername(e.target.value)} disabled={usernameLoading} autoFocus />
                        {username !== initialUsername && <div className="text-xs text-blue-400 mt-1">Previous: <span className="font-semibold">{initialUsername}</span></div>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-2 text-blue-700 uppercase tracking-wide">New Password</label>
                        <input type="password" className="border border-blue-200 rounded-lg px-4 py-2 w-full bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base transition" placeholder="Enter new password" value={password} onChange={e => setPassword(e.target.value)} disabled={passwordLoading} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-2 text-blue-700 uppercase tracking-wide">Confirm Password</label>
                        <input type="password" className="border border-blue-200 rounded-lg px-4 py-2 w-full bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base transition" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={passwordLoading} />
                      </div>
                      {formError && <div className="flex items-center gap-2 text-red-600 text-sm font-medium"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z"></path></svg>{formError}</div>}
                      {formSuccess && <div className="flex items-center gap-2 text-green-600 text-sm font-medium"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg>{formSuccess}</div>}
                      <button type="submit" className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-400 text-white font-semibold shadow hover:from-blue-700 hover:to-blue-500 transition disabled:opacity-60" disabled={usernameLoading || passwordLoading}>{(usernameLoading || passwordLoading) ? "Saving..." : "Save Changes"}</button>
                    </form>
                    <div className="mt-8 pt-4 border-t border-blue-100">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-blue-400 mb-2">Danger Zone</span>
                        <button className="w-full bg-gradient-to-r from-red-500 to-red-700 text-white py-2 rounded-lg hover:from-red-600 hover:to-red-800 font-semibold shadow transition" onClick={() => setShowDeleteConfirm(true)}>Delete Account</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md text-center shadow-xl animate-fade-in">
                  <h3 className="text-xl font-bold text-red-600 mb-4">Are you sure?</h3>
                  <p className="text-gray-600 mb-6">This action is <span className="font-semibold text-red-600">permanent</span> and cannot be undone.</p>
                  <div className="flex justify-center gap-4">
                    <button className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                    <button className="px-6 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition" onClick={async () => { await handleDeleteAccount(); setShowDeleteConfirm(false); setShowAccountModal(false); }}>Yes, Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style jsx global>{`
        .glass-card { background: rgba(255,255,255,0.7); backdrop-filter: blur(24px) saturate(1.5); -webkit-backdrop-filter: blur(24px) saturate(1.5); box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18); }
        .glass-form-section { background: rgba(255,255,255,0.55); border-radius: 0 0 1rem 1rem; backdrop-filter: blur(12px) saturate(1.2); }
        @keyframes fade-in { from { opacity: 0; transform: scale(0.95);} to { opacity: 1; transform: scale(1);} }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        @keyframes slide-up { from { opacity: 0; transform: translateY(40px);} to { opacity: 1; transform: translateY(0);} }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.4,0,0.2,1); }
      `}</style>
    </div>
  );
}

export default SideNav;