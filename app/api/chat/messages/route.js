// app/api/chat/messages/route.js
import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';

// Helper function to recursively delete all documents in a subcollection
async function deleteCollection(db, collectionPath, batchSize) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve, reject);
  });
}

async function deleteQueryBatch(db, query, resolve, reject) {
  try {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
      // When there are no documents left, we are done
      resolve();
      return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid hitting stack limits
    process.nextTick(() => {
      deleteQueryBatch(db, query, resolve, reject);
    });
  } catch(error) {
    reject(error);
  }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const chatId = searchParams.get('chatId');

        if (!chatId) {
            return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
        }

        // Only delete the "messages" subcollection
        await deleteCollection(adminDb, `chats/${chatId}/messages`, 100);

        return NextResponse.json({ success: true, message: "All messages deleted successfully." });
    } catch (err) {
        console.error("API DELETE /messages Error:", err);
        return NextResponse.json({ error: "Failed to clear messages" }, { status: 500 });
    }
}