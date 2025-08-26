"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { app } from "../../../../../firebaseConfig"; // Ensure this path is correct
import { 
    getFirestore, doc, setDoc, updateDoc, onSnapshot, collection, addDoc, getDocs, deleteDoc 
} from "firebase/firestore";
import { Mic, MicOff, Video, VideoOff, PhoneOff, WifiOff } from 'lucide-react';

// Main component containing the WebRTC logic.
function MeetingPageContent() {
    const params = useSearchParams();
    const room = params.get("room");
    const name = params.get("name") || "Guest";
    const isModerator = params.get("moderator") === "true";

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

    useEffect(() => {
        const firestore = getFirestore(app);
        setDb(firestore);
    }, []);

    // This effect handles the entire WebRTC setup and signaling
    useEffect(() => {
        // Ensure this setup runs only once, even in Strict Mode
        if (!db || !room || initialized.current) return;
        initialized.current = true;

        const servers = {
            iceServers: [ { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] } ],
        };

        const startCall = async () => {
            setStatus("Requesting camera & mic...");
            try {
                // 1. Get local media
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                
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

                pc.current.onconnectionstatechange = () => {
                    console.log(`Connection state: ${pc.current.connectionState}`);
                    if (pc.current.connectionState === 'failed') setStatus("Connection failed.");
                    if (pc.current.connectionState === 'disconnected') {
                        setStatus("Peer has disconnected.");
                        setRemoteStream(null);
                        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                    }
                };

                // 5. Start the signaling process
                await setupSignaling();

            } catch (error) {
                console.error("Error starting call:", error);
                setStatus("Error: Could not access camera/mic.");
            }
        };

        const setupSignaling = async () => {
            const callDoc = doc(db, 'meetings', room);
            const offerCandidates = collection(callDoc, 'offerCandidates');
            const answerCandidates = collection(callDoc, 'answerCandidates');

            pc.current.onicecandidate = async (event) => {
                if (event.candidate) {
                    const candidatesCollection = isModerator ? offerCandidates : answerCandidates;
                    await addDoc(candidatesCollection, event.candidate.toJSON());
                }
            };

            if (isModerator) {
                setStatus("Creating meeting...");
                const offerDescription = await pc.current.createOffer();
                await pc.current.setLocalDescription(offerDescription);
                await setDoc(callDoc, { offer: { sdp: offerDescription.sdp, type: offerDescription.type } });
                
                setStatus("Waiting for another person to join...");

                onSnapshot(callDoc, (snapshot) => {
                    const data = snapshot.data();
                    if (!pc.current.currentRemoteDescription && data?.answer) {
                        setStatus("Connecting...");
                        pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                    }
                });

                onSnapshot(answerCandidates, (snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') pc.current.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                    });
                });

            } else { // Participant logic
                setStatus("Joining meeting...");
                onSnapshot(callDoc, async (snapshot) => {
                    const data = snapshot.data();
                    if (data?.offer && !pc.current.currentRemoteDescription) {
                        setStatus("Found meeting, creating answer...");
                        await pc.current.setRemoteDescription(new RTCSessionDescription(data.offer));
                        const answerDescription = await pc.current.createAnswer();
                        await pc.current.setLocalDescription(answerDescription);
                        await updateDoc(callDoc, { answer: { type: answerDescription.type, sdp: answerDescription.sdp } });
                        setStatus("Connecting...");
                    }
                });

                onSnapshot(offerCandidates, (snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') pc.current.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                    });
                });
            }
        };

        startCall();

        // Cleanup logic
        return () => {
            if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
            if (pc.current) pc.current.close();
        };

    }, [db, room]); // Dependency array ensures this runs when db and room are ready

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

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <h1 className="text-2xl font-bold mb-2">Meeting Room: {room}</h1>
            <p className="mb-4 text-gray-400">Your name: {name}</p>
            
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-lg shadow-lg overflow-hidden">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-4 right-4 w-1/4 max-w-[240px] rounded-md border-2 border-gray-600" />

                {!remoteStream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="text-center">
                            {status.startsWith("Error") ? <WifiOff className="mx-auto h-12 w-12 text-red-500" /> : <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div> }
                            <p className="text-xl mt-4">{status}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-center gap-4">
                <button onClick={toggleMute} className={`p-3 rounded-full transition ${isMuted ? 'bg-red-500' : 'bg-gray-600 hover:bg-gray-500'}`}>
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                <button onClick={toggleVideo} className={`p-3 rounded-full transition ${isVideoOff ? 'bg-red-500' : 'bg-gray-600 hover:bg-gray-500'}`}>
                    {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                </button>
                <button onClick={hangUp} className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition">
                    <PhoneOff size={24} />
                </button>
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
