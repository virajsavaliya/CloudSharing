"use client";
import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getAuth } from "firebase/auth";
import { app } from "../../../../../firebaseConfig"; // Updated relative path

function MeetingJoinContent() {
  const params = useSearchParams();
  const room = params.get("room");
  // Try to get user info from params, fallback to Firebase Auth
  const auth = getAuth(app);
  const currentUser = auth.currentUser;
  const email = params.get("email") || currentUser?.email || "";
  const name =
    params.get("name") ||
    currentUser?.displayName ||
    (currentUser?.email ? currentUser.email.split("@")[0] : "");
  const jitsiContainerRef = useRef(null);

  useEffect(() => {
    if (room && name && jitsiContainerRef.current) {
      const scriptId = "jitsi-api";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = () => {
          createJitsi();
        };
        document.body.appendChild(script);
      } else {
        createJitsi();
      }
    }

    function createJitsi() {
      if (!window.JitsiMeetExternalAPI) return;
      jitsiContainerRef.current.innerHTML = "";
      const domain = "meet.jit.si";
      const options = {
        roomName: room,
        width: "100%",
        height: 600,
        parentNode: jitsiContainerRef.current,
        userInfo: { displayName: name, email: email || undefined },
        configOverwrite: {
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          HIDE_INVITE_MORE_HEADER: true,
        },
        // jwt: "YOUR_JWT_TOKEN", // For self-hosted Jitsi with JWT auth
      };
      new window.JitsiMeetExternalAPI(domain, options);
    }
    return () => {
      if (jitsiContainerRef.current) {
        jitsiContainerRef.current.innerHTML = "";
      }
    };
  }, [room, name, email]);

  if (!room || !name) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-lg font-semibold mb-2">Invalid meeting link.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Meeting Room</h1>
      <div ref={jitsiContainerRef} className="w-full max-w-5xl h-[600px]" />
    </div>
  );
}

export default function MeetingJoinPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <MeetingJoinContent />
    </Suspense>
  );
}