// Updated TopHeader: sidebar hidden by default, only on mobile, toggles via hamburger
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Home as HomeIcon,
  Trash2 as TrashIcon,
  Upload as UploadIcon,
  Folder as FolderIcon,
  HelpCircle as HelpIcon,
  Shield,
  Settings,
  Video as VideoIcon, // Add Video icon for Meeting
  MessageSquare as ChatIcon // Add Chat icon for Chat
} from "lucide-react";
import { useAuth } from "../../_utils/FirebaseAuthContext";
import ProfileAvatar from "./ProfileAvatar";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { getAuth, updateProfile, updatePassword } from "firebase/auth";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

function TopHeader() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [navClosing, setNavClosing] = useState(false);
  const [hamburgerActive, setHamburgerActive] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Manage Account modal state
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [username, setUsername] = useState(user?.displayName || "");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [profilePicLoading, setProfilePicLoading] = useState(false);
  const [profilePicSuccess, setProfilePicSuccess] = useState(false);
  const fileInputRef = useRef();
  const initialUsername = useRef(user?.displayName || "").current;

  useEffect(() => {
    // Fetch user role from Firestore for admin access
    const fetchRole = async () => {
      if (user && user.uid) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        setUserRole(userDoc.exists() ? userDoc.data().role : null);
      }
    };
    fetchRole();
  }, [user]);

  const closeMenu = () => {
    setNavClosing(true);
    setHamburgerActive(false);
    setTimeout(() => {
      setMenuOpen(false);
      setNavClosing(false);
    }, 350);
  };

  const toggleMenu = () => {
    if (!menuOpen) {
      setMenuOpen(true);
      setHamburgerActive(true);
    } else {
      closeMenu();
    }
  };

  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);

  // Menu items with gray Lucide icons, large size
  const menuItems = [
    {
      name: "Home",
      href: "/",
      icon: <HomeIcon className="w-7 h-7 text-gray-500" />,
    },
    {
      name: "Files",
      href: "/files",
      icon: <FolderIcon className="w-7 h-7 text-gray-500" />,
    },
    {
      name: "Upload",
      href: "/upload",
      icon: <UploadIcon className="w-7 h-7 text-gray-500" />,
    },
    {
      name: "Meeting",
      href: "/meeting",
      icon: <VideoIcon className="w-7 h-7 text-gray-500" />, // Use video icon for Meeting
    },
    {
      name: "Chat",
      href: "/chat",
      icon: <ChatIcon className="w-7 h-7 text-gray-500" />, // Use chat icon for Chat
    },
    {
      name: "Upgrade",
      href: "/upgrade",
      icon: <Shield className="w-7 h-7 text-gray-500" />,
      hide: userRole === "admin",
    },
    {
      name: "Recycle",
      href: "/recycle",
      icon: <TrashIcon className="w-7 h-7 text-gray-500" />,
    },
     {
      name: "Admin Panel",
      href: "/admin",
      icon: <Settings className="w-7 h-7 text-gray-500" />,
      show: userRole === "admin",
    },
    {
      name: "Help",
      href: "/help",
      icon: <HelpIcon className="w-7 h-7 text-gray-500" />,
    }    
  ];

  // Profile picture upload handler
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
      setProfilePicSuccess(true);
      setTimeout(() => setProfilePicSuccess(false), 1500);
    } catch (e) {
      alert("Failed to update profile picture.");
    }
    setProfilePicLoading(false);
  };

  // Username/password update handler
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

  const handleManageAccount = () => {
    setShowAccountModal(true);
    setProfileMenuOpen(false);
    setMenuOpen(false); // Ensure sidebar closes
    setNavClosing(false);
    setHamburgerActive(false);
  };

  // Add this handler to ensure all menus close before opening the profile menu
  const handleOpenProfileMenu = () => {
    setMenuOpen(false);
    setNavClosing(false);
    setHamburgerActive(false);
    setProfileMenuOpen(true);
  };

  return (
    <>
      {/* Header */}
      <div className={`fixed top-0 left-0 w-full flex items-center justify-between p-4 bg-white md:hidden transition-all duration-300 z-[49] ${menuOpen ? 'z-40' : 'z-50'}`}>
        <button
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className={`hamburger-animated ${hamburgerActive ? "active" : ""}`}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="flex-1 flex justify-center items-center gap-2">
          <Image src="/logo.svg" width={120} height={40} alt="Logo" />
          <span className="text-xs bg-yellow-400 text-yellow-900 font-semibold px-2 py-0.5 rounded-full shadow-sm">
            Beta
          </span>
        </div>

        <div className="relative">
          <button onClick={toggleProfileMenu} className="focus:outline-none">
            {user ? (
              <ProfileAvatar user={user} size={40} />
            ) : null}
          </button>

        </div>
      </div>

      {/* Slide-in Sidebar - only shown if menuOpen */}
      {(menuOpen || navClosing) && (
        <div className="fixed top-0 left-0 h-screen w-screen z-[60] md:hidden">
          <aside
            className={`glass-container fixed top-0 left-0 h-screen w-screen bg-white shadow-lg z-[60] p-0 overflow-y-auto flex flex-col
              ${menuOpen && !navClosing ? "animated-slide-in" : ""}
              ${navClosing ? "animated-slide-out" : ""}`}
            style={{ boxSizing: "border-box", paddingLeft: "18px", paddingBottom: "18px" }}
          >
            {/* Place close button at the same spot as hamburger */}
            <div className="flex items-center justify-between p-4 pb-0">
              <div style={{ width: 28 }} /> {/* Spacer to match hamburger icon width */}
              <div className="flex-1 flex justify-center">
                <Image src="/logo.svg" width={120} height={40} alt="Logo" />
              </div>
              <button
                aria-label="Close menu"
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition"
                onClick={toggleMenu}
                style={{
                  width: 28,
                  height: 28,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer"
                }}
              >
                {/* SVG close icon */}
                <svg width="44" height="44" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="6" y1="6" x2="16" y2="16" />
                  <line x1="16" y1="6" x2="6" y2="16" />
                </svg>
              </button>
            </div>
            {/* Profile Section */}
            <section className="profile-section flex flex-row items-center gap-4 mt-2 mb-6 px-6">
              {user ? (
                <div className="relative flex-shrink-0">
                  <div
                    className="profile-img"
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      border: "3px solid #7c4dff",
                      overflow: "hidden",
                      boxShadow: "0 0 8px 1px rgba(124, 77, 255, 0.6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#fff"
                    }}
                  >
                    <ProfileAvatar user={user} size={60} />
                  </div>
                </div>
              ) : null}
              <div className="profile-info flex flex-col items-start mt-1 flex-1 min-w-0">
                <span className="profile-name font-semibold text-base text-gray-900 truncate w-full">
                  {user?.displayName || "User"}
                </span>
                <span className="profile-email text-xs text-gray-500 truncate w-full">
                  {user?.email || "user@example.com"}
                </span>
                <div className="w-full flex">
                  <button
                    className="mt-3 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium text-sm shadow transition w-full text-center"
                    onClick={handleOpenProfileMenu}
                  >
                    Manage
                  </button>
                </div>
              </div>
            </section>

            <hr className="divider" />

            {/* Menu Section */}
            <nav className="flex-1">
              <ul className="menu-list flex flex-col gap-2 px-4">
                {menuItems.map((item, idx) => {
                  if (item.hide) return null;
                  if (item.show === false) return null;
                  if (item.name === "Admin Panel" && userRole !== "admin") return null;
                  return (
                    <li className="menu-item" key={idx}>
                      <Link href={item.href} className="menu-link" onClick={closeMenu}>
                        <div className="flex items-center w-full h-full gap-4 px-4 py-3">
                          {item.icon}
                          <span className="text-lg flex items-center gap-1">
                            {item.name}
                            {(item.name === "Chat" || item.name === "Meeting") && (
                              <span className="text-[10px] bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded-full ml-1">
                                Beta
                              </span>
                            )}
                          </span>


                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
        </div>
      )}

      {/* Profile menu popup - shown on profile button click */}
      {profileMenuOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs relative border border-blue-100 flex flex-row items-center">
            {user ? (
              <ProfileAvatar user={user} size={60} className="profile-img mr-4" />
            ) : null}
            <div className="flex flex-col flex-1">
              <div className="font-bold text-lg mb-1">{user?.displayName || "User"}</div>
              <div className="text-gray-500 text-sm mb-4">{user?.email || "user@example.com"}</div>
              <button
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold shadow"
                onClick={handleManageAccount}
              >
                Manage Account
              </button>
              {/* Logout Button */}
              <button
                className="mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-semibold text-sm shadow transition"
                onClick={logout}
              >
                Logout
              </button>
            </div>
            <button
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition"
              onClick={() => setProfileMenuOpen(false)}
              aria-label="Close"
              style={{ zIndex: 100 }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" className="block" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="6" y1="6" x2="16" y2="16" />
                <line x1="16" y1="6" x2="6" y2="16" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Manage Account Modal (same design as SideNav) */}
      {showAccountModal && user && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-40">
          <div
            className="relative w-full max-w-md rounded-xl shadow-2xl animate-slide-up glass-card border border-blue-300 overflow-hidden"
            style={{
              minWidth: 340,
              maxWidth: 400,
              minHeight: 480,
              padding: 0,
            }}
          >
            {/* Gradient header with avatar */}
            <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-400 to-blue-300 p-6 pb-3">
              <button
                className="absolute top-3 right-3 text-white text-2xl hover:text-blue-200 transition"
                onClick={() => setShowAccountModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <div className="mb-2 relative group">
                <ProfileAvatar user={user} size={64} />
                <button
                  type="button"
                  className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 shadow transition flex items-center justify-center"
                  style={{ width: 28, height: 28 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={profilePicLoading}
                  title="Change profile picture"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 5v14m7-7H5" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePicChange}
                  disabled={profilePicLoading}
                />
                {profilePicLoading && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-blue-100">Uploading...</span>
                )}
                {profilePicSuccess && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-green-200">Updated!</span>
                )}
              </div>
              <div className="text-white font-bold text-base mb-1">{user.displayName || "User"}</div>
              <div className="text-blue-100 text-xs">{user.email}</div>
            </div>
            {/* Form section */}
            <div className="p-6 pt-4 glass-form-section">
              <form className="flex flex-col gap-5" onSubmit={handleAccountFormSubmit} autoComplete="off">
                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold mb-2 text-blue-700 uppercase tracking-wide">Username</label>
                  <input
                    type="text"
                    className="border border-blue-200 rounded-lg px-4 py-2 w-full bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base transition"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    disabled={usernameLoading}
                    autoFocus
                  />
                  {/* Old username preview */}
                  {username !== initialUsername && (
                    <div className="text-xs text-blue-400 mt-1">
                      Previous: <span className="font-semibold">{initialUsername}</span>
                    </div>
                  )}
                </div>
                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold mb-2 text-blue-700 uppercase tracking-wide">New Password</label>
                  <input
                    type="password"
                    className="border border-blue-200 rounded-lg px-4 py-2 w-full bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base transition"
                    placeholder="Enter new password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={passwordLoading}
                  />
                </div>
                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold mb-2 text-blue-700 uppercase tracking-wide">Confirm Password</label>
                  <input
                    type="password"
                    className="border border-blue-200 rounded-lg px-4 py-2 w-full bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base transition"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={passwordLoading}
                  />
                </div>
                {/* Success/Error Messages */}
                {formError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z"></path>
                    </svg>
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    {formSuccess}
                  </div>
                )}
                {/* Save Button */}
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-400 text-white font-semibold shadow hover:from-blue-700 hover:to-blue-500 transition disabled:opacity-60"
                  disabled={usernameLoading || passwordLoading}
                >
                  {(usernameLoading || passwordLoading) ? "Saving..." : "Save Changes"}
                </button>
              </form>
              {/* Delete Account */}
              <div className="mt-8 pt-4 border-t border-blue-100">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-blue-400 mb-2">Danger Zone</span>
                  <button
                    className="w-full bg-gradient-to-r from-blue-400 to-blue-700 text-white py-2 rounded-lg hover:from-blue-500 hover:to-blue-800 font-semibold shadow transition"
                    onClick={() => alert("Account deletion only available in the main dashboard.")}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
              {/* Logout Button */}

            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .glass-container {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 1.75rem;
          color: #222;
          box-shadow: 0 8px 32px rgba(255, 255, 255, 0.12);
          user-select: none;
        }
        .hamburger-animated {
          width: 28px;
          height: 28px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          position: relative;
          z-index: 100;
        }
        .hamburger-animated span {
          display: block;
          width: 26px;
          height: 3px;
          margin: 3px 0;
          background: #222;
          border-radius: 2px;
          transition: 0.3s cubic-bezier(0.4,0,0.2,1);
          position: relative;
        }
        .hamburger-animated.active span:nth-child(1) {
          transform: translateY(6px) rotate(45deg);
        }
        .hamburger-animated.active span:nth-child(2) {
          opacity: 0;
        }
        .hamburger-animated.active span:nth-child(3) {
          transform: translateY(-6px) rotate(-45deg);
        }
        .animated-slide-in {
          animation: slideInLeft 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .animated-slide-out {
          animation: slideOutLeft 0.35s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-60px);}
          to { opacity: 1; transform: translateX(0);}
        }
        @keyframes slideOutLeft {
          from { opacity: 1; transform: translateX(0);}
          to { opacity: 0; transform: translateX(-60px);}
        }
        .profile-section {
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .profile-img {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 3px solid #7c4dff;
          object-fit: cover;
          box-shadow: 0 0 8px 1px rgba(124, 77, 255, 0.6);
        }
        .profile-info {
          margin-top: 0.5rem;
        }
        .profile-name {
          font-size: 1.1rem;
          color: #222;
          font-weight: 600;
          margin-bottom: 0.1rem;
        }
        .profile-email {
          font-size: 0.92rem;
          color: #666;
          font-weight: 400;
        }
        .divider {
          border: none;
          height: 1.5px;
          background: rgba(34, 34, 34, 0.10);
          margin: 0 2.5rem 1.5rem 2.5rem;
          border-radius: 10px;
        }
        .menu-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .menu-item {
          border-radius: 0.7rem;
          transition: background 0.18s, color 0.18s;
          margin-bottom: 0.2rem;
          overflow: hidden;
        }
        .menu-link {
          display: block;
          width: 100%;
          height: 100%;
          text-decoration: none;
          color: rgba(34, 34, 34, 0.85);
          font-weight: 500;
          transition: background 0.18s, color 0.18s;
        }
        .menu-item:hover, .menu-link:focus-visible {
          background: #e3edff;
          color: #2563eb;
        }
        .menu-item:hover .menu-link, .menu-link:focus-visible {
          color: #2563eb;
        }
        .menu-item:active {
          background: #d0e2ff;
        }
        .menu-link > div {
          width: 100%;
          height: 100%;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .close-x-btn {
          position: relative;
        }
        .close-x-icon {
          display: block;
          width: 24px;
          height: 24px;
          position: relative;
        }
        .close-x-icon::before,
        .close-x-icon::after {
          content: '';
          position: absolute;
          left: 11px;
          top: 3px;
          width: 2.5px;
          height: 18px;
          background: #222;
          border-radius: 2px;
        }
        .close-x-icon::before {
          transform: rotate(45deg);
        }
        .close-x-icon::after {
          transform: rotate(-45deg);
        }
        .glass-card {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(24px) saturate(1.5);
          -webkit-backdrop-filter: blur(24px) saturate(1.5);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
        }
        .glass-form-section {
          background: rgba(255,255,255,0.55);
          border-radius: 0 0 1rem 1rem;
          backdrop-filter: blur(12px) saturate(1.2);
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </>
  );
}

export default TopHeader;
