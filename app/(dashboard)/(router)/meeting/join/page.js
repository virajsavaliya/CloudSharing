"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { app } from "../../../../../firebaseConfig"; // Ensure this path is correct
import { 
    getFirestore, doc, setDoc, updateDoc, onSnapshot, collection, addDoc, getDocs, deleteDoc, getDoc, serverTimestamp 
} from "firebase/firestore";
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhone, FiUsers, FiMessageSquare, FiSettings } from 'react-icons/fi';
import { useAuth } from "../../../../_utils/FirebaseAuthContext"; // Add this import

// Main component containing the WebRTC logic.
function MeetingPageContent() {
    const { user } = useAuth(); // Add this line
    const params = useSearchParams();
    const room = params.get("room");
    const name = params.get("name") || "Guest";
    const isModerator = params.get("moderator") === "true";

    // Check if we're in a secure context (required for WebRTC)
    const isSecureContext = typeof window !== 'undefined' && (
        window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
    );

    // Refs for DOM elements and stable objects
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const pc = useRef(null);
    const localStreamRef = useRef(null);
    
    // Using a ref to prevent re-initialization on re-renders (due to Strict Mode)
    const initialized = useRef(false);

    // State for UI updates
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [db, setDb] = useState(null);
    const [status, setStatus] = useState("Initializing...");
    const [participants, setParticipants] = useState([]);
    const [showParticipants, setShowParticipants] = useState(false);
    const [permissionError, setPermissionError] = useState(null);
    const [hasPermissions, setHasPermissions] = useState(false);

    useEffect(() => {
        const firestore = getFirestore(app);
        setDb(firestore);
    }, []);

    // Function to check if media devices are available
    const checkMediaDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            const audioDevices = devices.filter(device => device.kind === 'audioinput');

            console.log("Available devices:");
            console.log("Video devices:", videoDevices.length);
            console.log("Audio devices:", audioDevices.length);

            return { videoDevices: videoDevices.length, audioDevices: audioDevices.length };
        } catch (error) {
            console.error("Error enumerating devices:", error);
            return { videoDevices: 0, audioDevices: 0 };
        }
    };

    // Function to request media permissions
    const requestMediaPermissions = async () => {
        // If we already have permissions, don't request again
        if (hasPermissions && localStreamRef.current) {
            console.log("Already have permissions, skipping request");
            return localStreamRef.current;
        }

        try {
            setPermissionError(null);
            setStatus("Checking available devices...");

            // Check if getUserMedia is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Your browser doesn't support camera/microphone access. Please use a modern browser like Chrome, Firefox, or Safari.");
            }

            // First check if devices are available
            const { videoDevices, audioDevices } = await checkMediaDevices();

            console.log("Devices found - Video:", videoDevices, "Audio:", audioDevices);

            if (videoDevices === 0 && audioDevices === 0) {
                throw new Error("No camera or microphone devices found. Please connect a camera/microphone.");
            }

            setStatus("Requesting camera & microphone permissions...");

            console.log("Requesting user media with constraints:", {
                video: videoDevices > 0 ? { width: 1280, height: 720 } : false,
                audio: audioDevices > 0
            });

            // Request media access directly - let the browser handle permission prompts
            const stream = await navigator.mediaDevices.getUserMedia({
                video: videoDevices > 0 ? { width: 1280, height: 720 } : false,
                audio: audioDevices > 0 ? true : false
            });

            console.log("Successfully got media stream:", stream);
            console.log("Video tracks:", stream.getVideoTracks().length);
            console.log("Audio tracks:", stream.getAudioTracks().length);

            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            setHasPermissions(true);
            setStatus("Permissions granted - setting up connection...");

            return stream;
        } catch (error) {
            console.error("Permission error:", error);
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            let errorMessage = "Could not access camera/microphone.";

            if (error.name === 'NotAllowedError') {
                errorMessage = "Camera/microphone access denied. Please click 'Allow' when prompted, or check your browser settings to allow access for this website.";
            } else if (error.name === 'NotFoundError') {
                errorMessage = "No camera or microphone found. Please connect a camera/microphone and try again.";
            } else if (error.name === 'NotReadableError') {
                errorMessage = "Camera/microphone is already in use by another application.";
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = "Camera/microphone doesn't support the requested settings. Trying with basic settings...";
                // Try again with basic constraints
                try {
                    console.log("Trying fallback constraints...");
                    const basicStream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    });
                    console.log("Fallback successful:", basicStream);
                    localStreamRef.current = basicStream;
                    if (localVideoRef.current) localVideoRef.current.srcObject = basicStream;
                    setHasPermissions(true);
                    setStatus("Permissions granted - setting up connection...");
                    return basicStream;
                } catch (fallbackError) {
                    console.error("Fallback error:", fallbackError);
                    errorMessage = "Camera/microphone access failed. Please check your device and browser settings.";
                }
            } else if (error.message.includes("devices found")) {
                errorMessage = error.message;
            } else {
                errorMessage = `Access failed: ${error.message}`;
            }

            setPermissionError(errorMessage);
            setStatus("Permission Error");
            throw error;
        }
    };

    // This effect handles the entire WebRTC setup and signaling
    useEffect(() => {
        // Ensure this setup runs only once, even in Strict Mode
        if (!db || !room || initialized.current) {
            console.log("Skipping initialization - db:", !!db, "room:", room, "initialized:", initialized.current);
            return;
        }
        initialized.current = true;
        console.log("Starting WebRTC initialization for room:", room);

        const servers = {
            iceServers: [ { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] } ],
        };

        const startCall = async () => {
            try {
                console.log("=== Starting Call ===");
                console.log("Is Secure Context:", isSecureContext);
                console.log("Protocol:", window.location.protocol);
                console.log("Hostname:", window.location.hostname);

                // Check if we're in a secure context
                if (!isSecureContext) {
                    setPermissionError("Video calls require a secure connection (HTTPS). Please access this page over HTTPS.");
                    setStatus("Security Error");
                    return;
                }

                // 1. Get local media with proper permission handling
                const stream = await requestMediaPermissions();

                console.log("Got stream, setting up connection...");
                setStatus("Setting up connection...");

                // 2. Create Peer Connection
                pc.current = new RTCPeerConnection(servers);

                // 3. Add local tracks to the connection
                stream.getTracks().forEach((track) => {
                    pc.current.addTrack(track, stream);
                });

                // 4. Set up listeners for remote events
                pc.current.ontrack = (event) => {
                    setStatus("Connected!");
                    setRemoteStream(event.streams[0]);
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
                };

                // 5. Start the signaling process
                await setupSignaling();

            } catch (error) {
                console.error("Error starting call:", error);
                // Error handling is now done in requestMediaPermissions
            }
        };

        const setupSignaling = async () => {
            try {
                const callDoc = doc(db, 'meetings', room);
                const offerCandidates = collection(callDoc, 'offerCandidates');
                const answerCandidates = collection(callDoc, 'answerCandidates');

                // Debug logs
                console.log('Setting up signaling for room:', room);
                console.log('Is moderator:', isModerator);

                // ICE candidate handling
                pc.current.onicecandidate = async (event) => {
                    if (event.candidate) {
                        console.log('New ICE candidate:', event.candidate);
                        try {
                            await addDoc(
                                isModerator ? offerCandidates : answerCandidates,
                                event.candidate.toJSON()
                            );
                        } catch (e) {
                            console.error('Error adding ICE candidate:', e);
                        }
                    }
                };

                if (isModerator) {
                    setStatus("Creating meeting offer...");
                    
                    // Create and set offer
                    const offerDescription = await pc.current.createOffer();
                    await pc.current.setLocalDescription(offerDescription);
                    
                    console.log('Created offer:', offerDescription);
                    
                    await setDoc(callDoc, { 
                        offer: { sdp: offerDescription.sdp, type: offerDescription.type },
                        createdAt: serverTimestamp(),
                        moderator: user?.email || 'anonymous',
                        moderatorName: name
                    });

                    setStatus("Waiting for participant to join...");

                    // Listen for answer
                    onSnapshot(callDoc, (snapshot) => {
                        const data = snapshot.data();
                        if (!pc.current.currentRemoteDescription && data?.answer) {
                            console.log('Received answer:', data.answer);
                            setStatus("Connecting to participant...");
                            const answerDescription = new RTCSessionDescription(data.answer);
                            pc.current.setRemoteDescription(answerDescription);
                        }
                    });

                } else {
                    setStatus("Joining meeting...");
                    
                    // Get the offer
                    const callData = (await getDoc(callDoc)).data();
                    
                    if (!callData?.offer) {
                        setStatus("Error: Meeting not found");
                        return;
                    }

                    console.log('Received offer:', callData.offer);
                    
                    // Set remote description from offer
                    await pc.current.setRemoteDescription(new RTCSessionDescription(callData.offer));
                    
                    // Create and set answer
                    const answerDescription = await pc.current.createAnswer();
                    await pc.current.setLocalDescription(answerDescription);
                    
                    console.log('Created answer:', answerDescription);
                    
                    await updateDoc(callDoc, { 
                        answer: { 
                            type: answerDescription.type, 
                            sdp: answerDescription.sdp 
                        },
                        participant: user?.email || 'anonymous',
                        participantName: name
                    });

                    setStatus("Connecting to host...");
                }

                // Handle ICE candidates
                onSnapshot(
                    isModerator ? answerCandidates : offerCandidates, 
                    (snapshot) => {
                        snapshot.docChanges().forEach((change) => {
                            if (change.type === 'added') {
                                const data = change.doc.data();
                                console.log('Adding ICE candidate:', data);
                                pc.current.addIceCandidate(new RTCIceCandidate(data));
                            }
                        });
                    }
                );

            } catch (err) {
                console.error('Error in setupSignaling:', err);
                setStatus(`Connection Error: ${err.message}`);
            }
        };

        startCall();

        // Cleanup logic
        return () => {
            if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
            if (pc.current) pc.current.close();
        };

    }, [db, room]); // Dependency array ensures this runs when db and room are ready

    // Update connection state handler
    useEffect(() => {
        if (!pc.current) return;

        pc.current.onconnectionstatechange = () => {
            console.log('Connection state:', pc.current.connectionState);
            switch (pc.current.connectionState) {
                case 'connected':
                    setStatus('Connected!');
                    break;
                case 'disconnected':
                    setStatus('Disconnected - trying to reconnect...');
                    break;
                case 'failed':
                    setStatus('Connection failed - please rejoin');
                    break;
                case 'closed':
                    setStatus('Connection closed');
                    break;
            }
        };

        // Add ICE connection state monitoring
        pc.current.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', pc.current.iceConnectionState);
        };

    }, [pc.current]);

    const hangUp = async () => {
        if (isModerator && db && room) {
            const callDocRef = doc(db, 'meetings', room);
            const answerCandidatesQuery = collection(callDocRef, 'answerCandidates');
            const offerCandidatesQuery = collection(callDocRef, 'offerCandidates');
            
            (await getDocs(answerCandidatesQuery)).forEach(async (doc) => await deleteDoc(doc.ref));
            (await getDocs(offerCandidatesQuery)).forEach(async (doc) => await deleteDoc(doc.ref));
            await deleteDoc(callDocRef);
        }
        window.close();
    };

    const toggleMute = () => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getAudioTracks().forEach(track => { track.enabled = !track.enabled; });
        setIsMuted(prev => !prev);
    };

    const toggleVideo = () => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getVideoTracks().forEach(track => { track.enabled = !track.enabled; });
        setIsVideoOff(prev => !prev);
    };

    // Add Participants Panel component
    const ParticipantsPanel = () => (
        <div className={`absolute right-0 top-0 h-full w-72 bg-black/80 backdrop-blur-sm transform transition-transform duration-300 ${showParticipants ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium">Participants ({participants.length})</h3>
                    <button 
                      onClick={() => setShowParticipants(false)}
                      className="p-1 hover:bg-white/10 rounded-full text-white/60 hover:text-white"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                </div>
                <div className="space-y-2">
                    {participants.map((participant, index) => (
                        <div key={index} className="flex items-center gap-3 text-white/90 py-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                {participant.name[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-medium">{participant.name}</p>
                                <p className="text-xs text-white/60">{participant.isHost ? 'Host' : 'Participant'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // Add participants monitoring
    useEffect(() => {
        if (!db || !room) return;

        const meetingRef = doc(db, 'meetings', room);
        const unsubscribe = onSnapshot(meetingRef, (snapshot) => {
            const data = snapshot.data();
            if (data) {
                const participantsList = [];
                if (data.moderatorName) {
                    participantsList.push({
                        name: data.moderatorName,
                        email: data.moderator,
                        isHost: true
                    });
                }
                if (data.participantName) {
                    participantsList.push({
                        name: data.participantName,
                        email: data.participant,
                        isHost: false
                    });
                }
                setParticipants(participantsList);
            }
        });

        return () => unsubscribe();
    }, [db, room]);

    // Update the header section in the return statement
    return (
        <div className="min-h-screen bg-gray-900">
            <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-white font-medium">Meeting: {room}</h1>
                        <span className={`text-sm px-2 py-1 rounded ${
                            permissionError ? 'bg-red-600/20 text-red-400' :
                            hasPermissions ? 'bg-green-600/20 text-green-400' :
                            'bg-yellow-600/20 text-yellow-400'
                        }`}>
                          {status}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                          onClick={() => setShowParticipants(!showParticipants)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                        >
                          <FiUsers />
                          <span>{participants.length}</span>
                        </button>
                        <span className="text-sm text-gray-400">You: {name}</span>
                    </div>
                </div>
            </div>

            {/* Permission Error Overlay */}
            {permissionError && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-white text-lg font-semibold mb-2">Camera/Microphone Access Required</h3>
                        <p className="text-gray-300 text-sm mb-6">{permissionError}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await requestMediaPermissions();
                                        // If successful, restart the call
                                        if (hasPermissions) {
                                            window.location.reload();
                                        }
                                    } catch (error) {
                                        // Error already handled in requestMediaPermissions
                                    }
                                }}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                            >
                                Try Again
                            </button>
                        </div>
                        <div className="mt-4 text-xs text-gray-400">
                            <p>Make sure to:</p>
                            <ul className="text-left mt-2 space-y-1">
                                <li>• Click "Allow" when prompted by the browser</li>
                                <li>• Check browser settings for camera/microphone permissions</li>
                                <li>• Ensure no other app is using your camera/microphone</li>
                                <li>• Reload the page if you previously denied access</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Main content with Participants Panel */}
            <div className="max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-4 h-[calc(100vh-64px)] relative">
                {/* Video Grid */}
                <div className="flex-1 bg-black rounded-xl overflow-hidden relative">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    {/* Local Video */}
                    <div className="absolute bottom-4 right-4 w-48 aspect-video">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover rounded-lg border border-white/20"
                        />
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 rounded-full bg-black/50 backdrop-blur-sm">
                        <button
                          onClick={toggleMute}
                          className={`p-4 rounded-full transition ${
                            isMuted ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          {isMuted ? <FiMicOff className="text-white" /> : <FiMic className="text-white" />}
                        </button>
                        <button
                          onClick={toggleVideo}
                          className={`p-4 rounded-full transition ${
                            isVideoOff ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          {isVideoOff ? <FiVideoOff className="text-white" /> : <FiVideo className="text-white" />}
                        </button>
                        <button
                          onClick={hangUp}
                          className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition"
                        >
                          <FiPhone className="text-white" />
                        </button>
                    </div>

                    {/* Loading/Error State */}
                    {!remoteStream && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="text-center">
                          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-white mt-4 font-medium">{status}</p>
                        </div>
                      </div>
                    )}
                </div>

                {/* Updated Participants Panel */}
                {showParticipants && (
                  <div className="absolute right-0 top-0 h-full w-72 bg-black/80 backdrop-blur-sm transform transition-all duration-300 ease-in-out">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-medium">Participants ({participants.length})</h3>
                        <button 
                          onClick={() => setShowParticipants(false)}
                          className="p-1 hover:bg-white/10 rounded-full text-white/60 hover:text-white"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-2">
                        {participants.map((participant, index) => (
                          <div key={index} className="flex items-center gap-3 text-white/90 py-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                              {participant.name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{participant.name}</p>
                              <p className="text-xs text-white/60">{participant.isHost ? 'Host' : 'Participant'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
            </div>
        </div>
    );
}
export default function MeetingJoinPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading Meeting...</div>}>
            <MeetingPageContent />
        </Suspense>
    );
}
