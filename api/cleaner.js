// /api/cleaner.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// You can move this to env variables for security
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'file-sharing-app-c63a0.appspot.com'
});

const db = getFirestore();
const bucket = getStorage().bucket();

export default async function handler(req, res) {
    try {
        const now = Date.now();
        const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;

        const oldFilesSnapshot = await db.collection('recycle_bin')
            .where('deletedAt', '<=', now - sevenDaysInMillis)
            .get();

        if (oldFilesSnapshot.empty) {
            return res.status(200).json({ message: 'No files to delete.' });
        }

        oldFilesSnapshot.forEach(async (doc) => {
            const fileData = doc.data();

            try {
                await bucket.file(fileData.storagePath).delete();
                await db.collection('recycle_bin').doc(doc.id).delete();
            } catch (error) {
                console.error(`Error deleting ${fileData.fileName}:`, error);
            }
        });

        return res.status(200).json({ message: 'Cleanup completed.' });
    } catch (error) {
        console.error('Error during cleanup:', error);
        return res.status(500).json({ error: 'Cleanup failed.' });
    }
}
