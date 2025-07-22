import { db } from "../../firebaseConfig"; // Adjust path as needed
import { collection, addDoc, getDocs, query, where, orderBy, doc, setDoc, getDoc, updateDoc, arrayUnion, deleteDoc, writeBatch } from "firebase/firestore";
import { NextResponse } from 'next/server';

const collectionName = "chats";

// POST: Save a new message
export async function POST(req) {
  try {
    const { senderId, receiverId, message, timestamp } = await req.json();
    if (!senderId || !receiverId || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    
    const msgTimestamp = timestamp || new Date().toISOString();
    await addDoc(collection(db, collectionName), { senderId, receiverId, message, timestamp: msgTimestamp });
    
    // Add sender to receiver's chatHistory if not present
    const usersCol = collection(db, "users");
    let senderSnap = await getDocs(query(usersCol, where("chatId", "==", senderId)));
    let receiverSnap = await getDocs(query(usersCol, where("chatId", "==", receiverId)));

    if (!senderSnap.empty && !receiverSnap.empty) {
      const senderData = senderSnap.docs[0].data();
      const receiverDoc = receiverSnap.docs[0];
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
        await updateDoc(receiverDoc.ref, { chatHistory: arrayUnion(newEntry) });
      }
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save message", details: err.message }, { status: 500 });
  }
}

// GET: Get chat history
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const user1 = searchParams.get('user1');
    const user2 = searchParams.get('user2');

    if (!user1 || !user2) {
      return NextResponse.json({ error: "Missing user ids" }, { status: 400 });
    }

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
    const messages = [
      ...snap1.docs.map(doc => doc.data()),
      ...snap2.docs.map(doc => doc.data())
    ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return NextResponse.json({ messages }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch chat history", details: err.message }, { status: 500 });
  }
}

// DELETE: Delete chat between two users
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const user1 = searchParams.get('user1');
    const user2 = searchParams.get('user2');

    if (!user1 || !user2) {
      return NextResponse.json({ error: "Missing user ids" }, { status: 400 });
    }
    
    const batch = writeBatch(db);
    
    const q1 = query(collection(db, collectionName), where("senderId", "==", user1), where("receiverId", "==", user2));
    const q2 = query(collection(db, collectionName), where("senderId", "==", user2), where("receiverId", "==", user1));
    
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    snap1.forEach(docSnap => batch.delete(docSnap.ref));
    snap2.forEach(docSnap => batch.delete(docSnap.ref));

    // Optional: Remove from each other's chatHistory array
    // This part is complex and might be better handled in a dedicated function
    
    await batch.commit();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete chat", details: err.message }, { status: 500 });
  }
}