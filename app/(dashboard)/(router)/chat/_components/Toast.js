// app/(dashboard)/(router)/chat/_components/Toast.js
import React, { useEffect } from 'react';

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    // When a message is displayed, set a timer.
    if (message) {
      const timer = setTimeout(() => {
        onClose(); // Call the onClose function after 3 seconds.
      }, 3000); // 3000 milliseconds = 3 seconds

      // Cleanup function: If the component unmounts or the message changes
      // before the timer finishes, this will prevent the old timer from firing.
      return () => clearTimeout(timer);
    }
  }, [message, onClose]); // This effect runs whenever the 'message' or 'onClose' props change.

  if (!message) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg z-[100]" role="alert">
      {message}
    </div>
  );
};

export default Toast;