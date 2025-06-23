import React, { useState } from "react";

// Shared ProfileAvatar: Google photoURL if available, fallback to generated avatar, with broken image fallback
const ProfileAvatar = ({ user, size = 40, className = "" }) => {
  const [imgError, setImgError] = useState(false);
  const name = user?.displayName || user?.email || "User";
  const uid = user?.uid || name;
  const photoURL = user?.photoURL;

  // Google-style pastel color generator
  function stringToPastelColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 80%)`;
  }

  const initial = name.trim().charAt(0).toUpperCase();
  const bgColor = stringToPastelColor(uid);

  // Show Google photo if available and not errored, else fallback
  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={name}
        className={`rounded-full object-cover border-2 border-blue-400 bg-gray-100 shadow-md ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback avatar
  return (
    <div
      className={`flex items-center justify-center rounded-full text-lg text-gray-800 shadow-sm font-semibold ${className}`}
      style={{ backgroundColor: bgColor, width: size, height: size, fontFamily: 'Roboto, sans-serif', fontWeight: 500 }}
    >
      {initial}
    </div>
  );
};

export default ProfileAvatar;
