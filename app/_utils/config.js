'use client';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side
    return process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  }
  // Server-side
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
};

const getApiUrl = () => {
  return `${getBaseUrl()}/api`;
};

const getFileUrl = (fileId) => {
  return `${getBaseUrl()}/f/${fileId}`;
};

export const config = {
  getBaseUrl,
  getApiUrl,
  getFileUrl
};