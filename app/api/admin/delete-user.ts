import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { db, deleteAllUserData } from '../../../firebaseConfig';

// Initialize Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(req: NextRequest) {
  const { uid, email } = await req.json();
  try {
    // Delete user from Firebase Auth
    await admin.auth().deleteUser(uid);

    // Delete all user data from Firestore/Storage
    await deleteAllUserData(uid, email);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}
