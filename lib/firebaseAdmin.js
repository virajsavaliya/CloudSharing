import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  try {
    // Check if the environment variable is available
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      throw new Error('The GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set.');
    }

    // Parse the JSON string from the environment variable
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    // Initialize the Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

  } catch (error) {
    console.error('Firebase admin initialization error:', error.stack);
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };