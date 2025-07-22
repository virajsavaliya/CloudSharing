import React from 'react';

const Toast = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg z-[100]" role="alert">
      {message}
    </div>
  );
};

export default Toast;