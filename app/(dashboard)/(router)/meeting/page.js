"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../../_utils/FirebaseAuthContext";
import Link from "next/link"; // Import the Link component

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


  if (loading || !user) {
    return <div className="text-center mt-16 animate-pulse">Loading...</div>;
  }

  return (
    // Added a main container and the NavLocation component
    <div className="p-5 px-8 md:px-8">
      <NavLocation />
      <div className="max-w-lg mx-auto mt-8 bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">Start a Video Meeting</h1>
        <p className="text-gray-600 mb-6 text-center">Create a new meeting or join an existing one using a link or code.</p>

        {/* --- Create Meeting Section --- */}
        <form className="w-full flex flex-col gap-4" onSubmit={handleCreate}>
          <input
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg"
          >
            Create New Meeting
          </button>
        </form>

        {/* --- Display Generated Meeting Link --- */}
        {meetingUrl && (
          <div className="mt-6 w-full bg-blue-50 p-4 rounded-lg">
            <div className="mb-2 text-sm font-semibold text-gray-700">Share this link to invite others:</div>
            <input
              className="border rounded-lg px-3 py-2 w-full text-sm bg-white"
              value={meetingUrl}
              readOnly
              onFocus={e => e.target.select()}
            />
          </div>
        )}

        <div className="w-full my-6 border-t"></div>

        {/* --- Join Meeting Section --- */}
        <div className="w-full">
          <button
            className="w-full text-blue-600 font-semibold text-center mb-4"
            onClick={() => setShowJoinSection(v => !v)}
          >
            {showJoinSection ? "▼ Hide Join Section" : "▶ Join a Meeting"}
          </button>
          {showJoinSection && (
            <form className="flex flex-col gap-3" onSubmit={handleDirectJoin}>
              <input
                className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                placeholder="Paste meeting link or enter room code"
                value={joinMeetingUrl}
                onChange={e => setJoinMeetingUrl(e.target.value)}
                required
              />
              <input
                className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                placeholder="Your Name"
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-green-600 text-white rounded-lg py-2 font-semibold hover:bg-green-700 transition shadow-md hover:shadow-lg"
              >
                Join Meeting
              </button>
            </form>
          )}
        </div>
         <div className="mt-8 text-xs text-gray-500 text-center">
          Powered by Cloud Sharing
        </div>
      </div>
    </div>
  );
}