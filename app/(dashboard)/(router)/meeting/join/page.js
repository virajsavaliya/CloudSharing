"use client";
import { useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getAuth } from "firebase/auth";
import { app } from "../../../../../firebaseConfig"; // Updated relative path

// This component contains the actual page logic.
// By extracting it, we can wrap it in <Suspense> in the main export.
function MeetingPageContent() {
  const params = useSearchParams();
  const room = params.get("room");

  const auth = getAuth(app);
  const currentUser = auth.currentUser;
  const email = params.get("email") || currentUser?.email || "";
  const name =
    params.get("name") ||
    currentUser?.displayName ||
    (currentUser?.email ? currentUser.email.split("@")[0] : "");
  const jitsiContainerRef = useRef(null);

  useEffect(() => {
    // FIX: Store the ref's current value in a variable inside the effect.
    const container = jitsiContainerRef.current;

    if (room && name && container) {
      const scriptId = "jitsi-api";
      // Ensure Jitsi script is loaded before creating the meeting
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = () => createJitsi(container);
        document.body.appendChild(script);
      } else {
        createJitsi(container);
      }
    }

    function createJitsi(jitsiNode) {
      if (!window.JitsiMeetExternalAPI || !jitsiNode) return;
      
      // Clear any previous instance
      jitsiNode.innerHTML = "";

      const domain = "meet.jit.si";
      const options = {
        roomName: room,
        width: "100%",
        height: 600,
        parentNode: jitsiNode,
        userInfo: { displayName: name, email: email || undefined },
        configOverwrite: {
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          HIDE_INVITE_MORE_HEADER: true,
        },
      };
      new window.JitsiMeetExternalAPI(domain, options);
    }

    // FIX: Use the local variable in the cleanup function.
    // This prevents the "exhaustive-deps" warning for the ref.
    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [room, name, email]);

  if (!room || !name) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-lg font-semibold mb-2">Invalid meeting link.</div>
        <div className="text-sm text-gray-500">Please check the URL and try again.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Meeting Room: {room}</h1>
      <div ref={jitsiContainerRef} className="w-full max-w-5xl h-[600px] rounded-lg shadow-lg overflow-hidden" />
    </div>
  );
}

// Main page export
export default function MeetingJoinPage() {
  // FIX: Wrap the component that uses `useSearchParams` in a <Suspense> boundary.
  // This tells Next.js to wait for the client-side rendering of this part.
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading Meeting...</div>}>
      <MeetingPageContent />
    </Suspense>
  );
}
