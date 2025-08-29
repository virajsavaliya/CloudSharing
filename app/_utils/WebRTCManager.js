export class WebRTCManager {
  constructor(roomId, userId, userName, db) {
    this.roomId = roomId;
    this.userId = userId;
    this.userName = userName;
    this.db = db;
    this.peerConnections = new Map();
    this.localStream = null;
    this.onStreamCallback = null;
    this.onParticipantCallback = null;
  }

  async initialize(localStream) {
    this.localStream = localStream;
    await this.joinRoom();
    this.listenToParticipants();
  }

  async joinRoom() {
    const roomRef = doc(this.db, 'meetings', this.roomId);
    const participantsRef = collection(roomRef, 'participants');

    // Add self to participants
    await setDoc(doc(participantsRef, this.userId), {
      userId: this.userId,
      userName: this.userName,
      joinedAt: serverTimestamp()
    });

    // Cleanup on window close
    window.addEventListener('beforeunload', () => this.leaveRoom());
  }

  listenToParticipants() {
    const roomRef = doc(this.db, 'meetings', this.roomId);
    const participantsRef = collection(roomRef, 'participants');

    onSnapshot(participantsRef, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        const participant = { id: change.doc.id, ...change.doc.data() };

        if (change.type === 'added' && participant.userId !== this.userId) {
          this.connectWithPeer(participant.userId);
        }
        if (change.type === 'removed') {
          this.removePeer(participant.userId);
        }
      });

      if (this.onParticipantCallback) {
        const participants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.onParticipantCallback(participants);
      }
    });
  }

  async connectWithPeer(peerId) {
    if (this.peerConnections.has(peerId)) return;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Store the connection
    this.peerConnections.set(peerId, pc);

    // Add local tracks
    this.localStream.getTracks().forEach(track => {
      pc.addTrack(track, this.localStream);
    });

    // Handle incoming streams
    pc.ontrack = (event) => {
      if (this.onStreamCallback) {
        this.onStreamCallback(peerId, event.streams[0]);
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected') {
        this.removePeer(peerId);
      }
    };

    // Create offer if we're the initiator
    if (peerId > this.userId) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      await setDoc(doc(this.db, 'meetings', this.roomId, 'calls', `${this.userId}_${peerId}`), {
        offer: { sdp: offer.sdp, type: offer.type }
      });
    }

    // Listen for remote signals
    this.setupSignaling(pc, peerId);
  }

  setupSignaling(pc, peerId) {
    const callDoc = doc(this.db, 'meetings', this.roomId, 'calls', `${peerId}_${this.userId}`);
    const callDoc2 = doc(this.db, 'meetings', this.roomId, 'calls', `${this.userId}_${peerId}`);

    // Listen for remote offer/answer
    onSnapshot(callDoc, async (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (data.offer && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await updateDoc(callDoc, { answer: { sdp: answer.sdp, type: answer.type } });
      }

      if (data.answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });
  }

  removePeer(peerId) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
  }

  async leaveRoom() {
    // Close all peer connections
    this.peerConnections.forEach(pc => pc.close());
    
    // Remove self from participants
    const participantRef = doc(this.db, 'meetings', this.roomId, 'participants', this.userId);
    await deleteDoc(participantRef);
  }

  onStream(callback) {
    this.onStreamCallback = callback;
  }

  onParticipantsChange(callback) {
    this.onParticipantCallback = callback;
  }
}
