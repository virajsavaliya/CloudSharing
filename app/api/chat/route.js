import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const createChatId = (user1, user2) => [user1, user2].sort().join('_');

// POST: Send a new message with security checks
export async function POST(req) {
    try {
        const token = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const decodedToken = await adminAuth.verifyIdToken(token);
        const authenticatedUserUid = decodedToken.uid;

        const { senderId, receiverId, message } = await req.json();

        // **THE FIX IS HERE**: Changed userDoc.exists() to userDoc.exists
        const userDoc = await adminDb.collection('users').doc(authenticatedUserUid).get();
        if (!userDoc.exists || userDoc.data().chatId !== senderId) {
             return NextResponse.json({ error: "Forbidden: Sender ID does not match authenticated user." }, { status: 403 });
        }

        if (!senderId || !receiverId || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const chatId = createChatId(senderId, receiverId);
        const messagesCol = adminDb.collection("chats").doc(chatId).collection("messages");
        
        await messagesCol.add({ 
            senderId, 
            message, 
            timestamp: FieldValue.serverTimestamp() 
        });
        
        return NextResponse.json({ success: true }, { status: 201 });

    } catch (err) {
        console.error("API POST Error:", err);
        if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }
}


// GET: Get chat history with pagination
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const user1 = searchParams.get('user1');
        const user2 = searchParams.get('user2');
        const cursor = searchParams.get('cursor');
        const limit = 25;

        if (!user1 || !user2) return NextResponse.json({ error: "Missing user IDs" }, { status: 400 });

        const chatId = createChatId(user1, user2);
        let messagesQuery = adminDb.collection("chats").doc(chatId).collection("messages")
                                 .orderBy("timestamp", "desc")
                                 .limit(limit);

        if (cursor) {
            messagesQuery = messagesQuery.startAfter(new Date(cursor));
        }
        
        const querySnapshot = await messagesQuery.get();

        const messages = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const timestamp = data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp;
            return { id: doc.id, ...data, timestamp };
        });

        return NextResponse.json({ messages: messages.reverse() });
    } catch (err) {
        if (err.message.includes('NOT_FOUND')) {
            return NextResponse.json({ messages: [] });
        }
        console.error("API GET Error:", err);
        return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
    }
}

// DELETE: a single message
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const chatId = searchParams.get('chatId');
        const messageId = searchParams.get('messageId');

        if (!chatId || !messageId) {
            return NextResponse.json({ error: "Missing chat ID or message ID" }, { status: 400 });
        }

        await adminDb
            .collection("chats")
            .doc(chatId)
            .collection("messages")
            .doc(messageId)
            .delete();

        return NextResponse.json({ success: true, message: "Message deleted" });
    } catch (err) {
        console.error("API DELETE Error:", err);
        return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
    }
}