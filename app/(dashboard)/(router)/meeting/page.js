"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../../_utils/FirebaseAuthContext"; // adjust path if needed
import { useRouter } from "next/navigation";

function randomRoom() {
  return "meeting-" + Math.random().toString(36).slice(2, 8);
}

export default function MeetingPage() {
  const { user, loading } = useAuth(); // Make sure your context provides loading state
  const [name, setName] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [joinMeetingUrl, setJoinMeetingUrl] = useState("");
  const [showJoinSection, setShowJoinSection] = useState(false);
  const [joinName, setJoinName] = useState(""); // <-- add state for join name
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setName(user.displayName || user.email || "");
      setJoinName(user.displayName || user.email || ""); // default join name
    }
  }, [user]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name) return;
    const room = randomRoom();
    // Jitsi: pass displayName and email as URL params in the hash
    const url = `/meeting/join?room=${room}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(user.email || "")}&moderator=true`;
    const fullUrl = window.location.origin + url;
    setMeetingUrl(fullUrl);
    window.open(fullUrl, "_blank");
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name || !meetingUrl) return;
    window.open(meetingUrl, "_blank");
  };

  const handleDirectJoin = (e) => {
    e.preventDefault();
    if (!joinMeetingUrl || !joinName) return;
    let url = joinMeetingUrl.trim();
    if (!/^https?:\/\//.test(url)) {
      // Assume it's a room code
      const room = encodeURIComponent(url.replace(/^meeting-/, ""));
      // Always use joinName as the display name
      url = `/meeting/join?room=${room}&name=${encodeURIComponent(joinName)}&email=${encodeURIComponent(user.email || "")}`;
      url = window.location.origin + url;
    } else {
      // If it's a full link, always overwrite/add the name param with joinName
      const u = new URL(url, window.location.origin);
      u.searchParams.set("name", joinName);
      url = u.toString();
    }
    window.open(url, "_blank");
  };

  if (loading) {
    return <div className="text-center mt-16">Loading...</div>;
  }

  if (!user) {
    return <div className="text-center mt-16">Please log in to start a meeting.</div>;
  }

  return (
    <div className="max-w-lg mx-auto mt-16 bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Start a Video Meeting</h1>
      <form className="w-full flex flex-col gap-4" onSubmit={handleCreate}>
        <input
          className="border rounded-lg px-4 py-2"
          placeholder="Enter your name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 transition"
        >
          Create Meeting
        </button>
      </form>
      {meetingUrl && (
        <div className="mt-6 w-full">
          <div className="mb-2 text-sm text-gray-700">Share this link:</div>
          <input
            className="border rounded-lg px-3 py-2 w-full text-sm"
            value={meetingUrl}
            readOnly
            onFocus={e => e.target.select()}
          />
          <button
            className="mt-3 w-full bg-green-600 text-white rounded-lg py-2 font-semibold hover:bg-green-700 transition"
            onClick={handleJoin}
          >
            Join Meeting
          </button>
        </div>
      )}
      {/* Join Meeting Section */}
      <div className="mt-8 w-full">
        <button
          className="w-full text-blue-600 underline text-sm mb-2"
          onClick={() => setShowJoinSection(v => !v)}
        >
          {showJoinSection ? "Hide Join Meeting" : "Join a Meeting"}
        </button>
        {showJoinSection && (
          <form className="flex flex-col gap-3" onSubmit={handleDirectJoin}>
            <input
              className="border rounded-lg px-4 py-2"
              placeholder="Paste meeting link or enter meeting code"
              value={joinMeetingUrl}
              onChange={e => setJoinMeetingUrl(e.target.value)}
              required
            />
            <input
              className="border rounded-lg px-4 py-2"
              placeholder="Your Name"
              value={joinName}
              onChange={e => setJoinName(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-green-600 text-white rounded-lg py-2 font-semibold hover:bg-green-700 transition"
            >
              Join Meeting
            </button>
          </form>
        )}
      </div>
      <div className="mt-8 text-xs text-gray-500 text-center">
        Powered by <a href="https://meet.jit.si" target="_blank" rel="noopener noreferrer" className="underline">Jitsi Meet</a> (no login required)
      </div>
    </div>
  );
}