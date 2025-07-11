import { db } from "../../firebaseConfig";
import { collection, addDoc, getDocs, query, where, orderBy, doc, setDoc, getDoc, updateDoc, arrayUnion, deleteDoc, writeBatch } from "firebase/firestore";

const collectionName = "chats"; // Firestore collection

export default async function handler(req, res) {
  // --- Add support for ?receiverOnly=ID ---
  if (req.method === "GET" && req.query.receiverOnly) {
    const receiverId = req.query.receiverOnly;
    if (!receiverId) return res.status(400).json({ error: "Missing receiver id" });
    try {
      const q = query(
        collection(db, collectionName),
        where("receiverId", "==", receiverId),
        orderBy("timestamp", "desc")
      );
      const snap = await getDocs(q);
      const messages = snap.docs.map(doc => doc.data());
      return res.status(200).json({ messages });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch messages" });
    }
  }

  if (req.method === "POST") {
    // Save a new message
    const { senderId, receiverId, message, timestamp } = req.body;
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ error: "Missing fields" });
    }
    try {
      // Ensure timestamp is always a string (ISO) for sorting and querying
      const msgTimestamp = timestamp || new Date().toISOString();
      await addDoc(collection(db, collectionName), { senderId, receiverId, message, timestamp: msgTimestamp });

      // --- Always add sender to receiver's chatHistory if not present ---
      const usersCol = collection(db, "users");
      // Find sender's user info by chatId
      let senderSnap = await getDocs(query(usersCol, where("chatId", "==", senderId)));
      let senderData = senderSnap.docs.length > 0 ? senderSnap.docs[0].data() : null;
      // Find receiver's UID by chatId
      let receiverSnap = await getDocs(query(usersCol, where("chatId", "==", receiverId)));
      if (senderData && receiverSnap.docs.length > 0) {
        const receiverDoc = receiverSnap.docs[0];
        const receiverUid = receiverDoc.id;
        const receiverData = receiverDoc.data();
        const chatHistory = receiverData.chatHistory || [];
        const alreadyExists = chatHistory.some(u => u.chatId === senderId);
        if (!alreadyExists) {
          const newEntry = {
            chatId: senderData.chatId,
            displayName: senderData.displayName || senderData.email || "",
            email: senderData.email || "",
            photoURL: senderData.photoURL || null,
          };
          await updateDoc(doc(db, "users", receiverUid), {
            chatHistory: arrayUnion(newEntry)
          });
        }
      }
      // --- END ---

      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Failed to save message" });
    }
  }

  if (req.method === "GET") {
    // Get chat history between two users
    const { user1, user2 } = req.query;
    if (!user1 || !user2) return res.status(400).json({ error: "Missing user ids" });
    try {
      // Firestore does not support multiple 'in' filters on different fields.
      // So, fetch both directions and merge.
      const q1 = query(
        collection(db, collectionName),
        where("senderId", "==", user1),
        where("receiverId", "==", user2),
        orderBy("timestamp", "asc")
      );
      const q2 = query(
        collection(db, collectionName),
        where("senderId", "==", user2),
        where("receiverId", "==", user1),
        orderBy("timestamp", "asc")
      );
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      // Defensive: filter out messages missing required fields
      const messages = [
        ...snap1.docs.map(doc => doc.data()),
        ...snap2.docs.map(doc => doc.data())
      ]
        .filter(m => m.senderId && m.receiverId && typeof m.message === "string" && m.timestamp)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      return res.status(200).json({ messages });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch chat history" });
    }
  }

  // --- DELETE chat between two users and remove from chatHistory and database ---
  if (req.method === "DELETE") {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) return res.status(400).json({ error: "Missing user ids" });
    try {
      // 1. Delete all messages between user1 and user2 (both directions)
      // Firestore does not support OR queries on two fields, so fetch both directions
      const q1 = query(
        collection(db, collectionName),
        where("senderId", "==", user1),
        where("receiverId", "==", user2)
      );
      const q2 = query(
        collection(db, collectionName),
        where("senderId", "==", user2),
        where("receiverId", "==", user1)
      );
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const batch = writeBatch(db);
      snap1.forEach(docSnap => batch.delete(docSnap.ref));
      snap2.forEach(docSnap => batch.delete(docSnap.ref));

      // Remove from chatHistory for both users (by UID, not chatId)
      const usersCol = collection(db, "users");
      // Find user1 UID
      let user1Snap = await getDocs(query(usersCol, where("chatId", "==", user1)));
      let user2Snap = await getDocs(query(usersCol, where("chatId", "==", user2)));
      if (user1Snap.docs.length > 0) {
        const user1Doc = user1Snap.docs[0];
        const user1Uid = user1Doc.id;
        const data = user1Doc.data();
        if (Array.isArray(data.chatHistory)) {
          const newHistory = data.chatHistory.filter(u => u.chatId !== user2);
          batch.update(doc(db, "users", user1Uid), { chatHistory: newHistory });
        }
      }
      if (user2Snap.docs.length > 0) {
        const user2Doc = user2Snap.docs[0];
        const user2Uid = user2Doc.id;
        const data = user2Doc.data();
        if (Array.isArray(data.chatHistory)) {
          const newHistory = data.chatHistory.filter(u => u.chatId !== user1);
          batch.update(doc(db, "users", user2Uid), { chatHistory: newHistory });
        }
      }

      await batch.commit();
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Failed to delete chat" });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}
