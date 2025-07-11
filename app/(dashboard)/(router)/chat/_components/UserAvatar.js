import Image from "next/image";
import { memo } from "react";

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

export default UserAvatar;
