// /api/cleaner.js
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Parse service account
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

// Initialize Firebase Admin (once per cold start)
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'file-sharing-app-c63a0.appspot.com',
  });
}

const db = getFirestore();
const bucket = getStorage().bucket();

export default async function handler(req, res) {
  try {
    const now = Date.now();
    const expiryTime = 1 * 60 * 1000; // For demo: files older than 1 minute

    const snapshot = await db
      .collection('recycle_bin')
      .where('deletedAt', '<=', now - expiryTime)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ message: 'No files to delete.' });
    }

    const deletionPromises = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const filePath = data.storagePath;

      const deletePromise = bucket
        .file(filePath)
        .delete()
        .then(() => db.collection('recycle_bin').doc(doc.id).delete());

      deletionPromises.push(deletePromise);
    });

    await Promise.all(deletionPromises);

    return res.status(200).json({ message: 'Files deleted successfully.' });
  } catch (error) {
    console.error('Cleaner Error:', error);
    return res.status(500).json({ error: 'Cleaner failed.', details: error.message });
  }
}
