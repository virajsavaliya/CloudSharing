import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebaseAdmin'; // Use the Admin SDK on the server
import { FieldValue } from 'firebase-admin/firestore';

// Helper to create a consistent, sorted chat ID
const createChatId = (user1, user2) => [user1, user2].sort().join('_');

// Use 'export async function POST(req)' for the App Router
export async function POST(req) {
  try {
    const { user1, user2 } = await req.json();

    if (!user1 || !user2) {
      return NextResponse.json({ error: 'user1 and user2 are required.' }, { status: 400 });
    }
    
    // With our improved data model, "mark as read" means updating a single document
    // that tracks the last time a user read a chat.
    const chatId = createChatId(user1, user2);
    const lastReadRef = adminDb.collection("chats").doc(chatId).collection("lastRead").doc(user1);

    // Set the timestamp to the current time on the server
    await lastReadRef.set({
        timestamp: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Error in mark-as-read:", error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}