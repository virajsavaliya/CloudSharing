"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../../_utils/FirebaseAuthContext";
import Link from "next/link";
import { FiVideo, FiUsers, FiLink, FiCopy, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import toast from 'react-hot-toast';

// --- Start of New Code ---
// The NavLocation component for breadcrumb navigation
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
            {/* Updated link to point to the correct page */}
            <Link
              href="/meeting"
              className="block transition hover:text-gray-700"
            >
              {" "}
              Meeting{" "}
            </Link>
          </li>
        </ol>
      </nav>
    </div>
  );
};
// --- End of New Code ---


// Generates a simple, random room name.
function randomRoom() {
  return "meeting-" + Math.random().toString(36).slice(2, 10);
}

export default function MeetingPage() {
  const { user, loading } = useAuth();
  const [name, setName] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [joinMeetingUrl, setJoinMeetingUrl] = useState("");
  const [showJoinSection, setShowJoinSection] = useState(false);
  const [joinName, setJoinName] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(`/login?redirect_url=${encodeURIComponent(pathname)}`);
      } else {
        const defaultName = user.displayName || (user.email ? user.email.split("@")[0] : "");
        setName(defaultName);
        setJoinName(defaultName);
      }
    }
  }, [user, loading, router, pathname]);


  const handleCreate = (e) => {
    e.preventDefault();
    if (!name) return;
    const room = randomRoom();
    const url = `/meeting/join?room=${room}&name=${encodeURIComponent(name)}&moderator=true`;
    const fullUrl = window.location.origin + url;
    setMeetingUrl(fullUrl);
    window.open(fullUrl, "_blank");
  };

  const handleDirectJoin = (e) => {
    e.preventDefault();
    if (!joinMeetingUrl || !joinName) return;
    let url = joinMeetingUrl.trim();

    if (!/^https?:\/\//.test(url)) {
      const room = encodeURIComponent(url.replace(/^meeting-/, ""));
      url = `/meeting/join?room=${room}&name=${encodeURIComponent(joinName)}`;
      url = window.location.origin + url;
    } else {
      try {
        const u = new URL(url, window.location.origin);
        u.searchParams.set("name", joinName);
        u.searchParams.delete("moderator");
        url = u.toString();
      } catch (error) {
        console.error("Invalid URL:", error);
        alert("The provided URL is invalid.");
        return;
      }
    }
    window.open(url, "_blank");
  };


  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(meetingUrl);
    toast.success('Link copied to clipboard');
  };

  if (loading || !user) {
    return <div className="text-center mt-16 animate-pulse">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header & Breadcrumb */}
      <div className="max-w-6xl mx-auto mb-8">
        <br/>
        
        {/* <NavLocation /> */}
        <h1 className="text-3xl font-bold text-gray-900">Video Meetings</h1>
        <p className="text-gray-600 mt-2">Create or join secure video meetings</p>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        {/* Create Meeting Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiVideo className="text-blue-600 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Create Meeting</h2>
              <p className="text-sm text-gray-500">Start a new video conference</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <FiVideo />
              Create New Meeting
            </button>
          </form>

          {meetingUrl && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Share meeting link</span>
                <button
                  onClick={copyLinkToClipboard}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <FiCopy className="w-5 h-5" />
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={meetingUrl}
                className="w-full bg-white px-3 py-2 rounded border border-blue-200 text-sm"
                onClick={e => e.target.select()}
              />
            </div>
          )}
        </div>

        {/* Join Meeting Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <FiUsers className="text-green-600 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Join Meeting</h2>
              <p className="text-sm text-gray-500">Enter a code or link</p>
            </div>
          </div>

          <form onSubmit={handleDirectJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Code or Link</label>
              <input
                type="text"
                value={joinMeetingUrl}
                onChange={e => setJoinMeetingUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter meeting code or paste link"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input
                type="text"
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your name"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <FiUsers />
              Join Meeting
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-8 text-center">
        <p className="text-sm text-gray-500">
          Secure, encrypted video meetings powered by Cloud Sharing
        </p>
      </div>
    </div>
  );
}