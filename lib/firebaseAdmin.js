import admin from 'firebase-admin';

// Import the service account key from the file you downloaded
import serviceAccount from '../serviceAccountKey.json';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };