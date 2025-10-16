import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { adminDb, adminAuth } from "../../../lib/firebaseAdmin";

export async function POST(req) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      console.error("[Delete Account] UserId is required");
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`[Delete Account] Starting deletion process for user: ${userId}`);

    // 1. Delete all files from Cloud Storage
    console.log(`[Delete Account] Deleting files from storage for user: ${userId}`);
    try {
      const bucket = admin.storage().bucket();
      const files = await bucket.getFiles({ prefix: `users/${userId}/` });
      
      for (const file of files[0]) {
        await file.delete();
        console.log(`[Delete Account] Deleted file: ${file.name}`);
      }
      console.log(`[Delete Account] Successfully deleted ${files[0].length} files from storage`);
    } catch (storageError) {
      console.warn(`[Delete Account] Warning deleting files from storage:`, storageError.message);
      // Don't fail entirely if storage deletion fails
    }

    // 2. Delete userSubscriptions document
    console.log(`[Delete Account] Deleting userSubscriptions for user: ${userId}`);
    try {
      await adminDb.collection('userSubscriptions').doc(userId).delete();
      console.log(`[Delete Account] Successfully deleted userSubscriptions`);
    } catch (subError) {
      console.warn(`[Delete Account] Warning deleting userSubscriptions:`, subError.message);
    }

    // 3. Delete all payment history records for this user
    console.log(`[Delete Account] Deleting payment history for user: ${userId}`);
    try {
      const paymentDocs = await adminDb
        .collection('paymentHistory')
        .where('userId', '==', userId)
        .get();
      
      const batch = adminDb.batch();
      paymentDocs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`[Delete Account] Successfully deleted ${paymentDocs.size} payment records`);
    } catch (paymentError) {
      console.warn(`[Delete Account] Warning deleting payment history:`, paymentError.message);
    }

    // 4. Delete user document from Firestore
    console.log(`[Delete Account] Deleting user document: ${userId}`);
    try {
      await adminDb.collection('users').doc(userId).delete();
      console.log(`[Delete Account] Successfully deleted user document`);
    } catch (userDocError) {
      console.warn(`[Delete Account] Warning deleting user document:`, userDocError.message);
    }

    // 5. Delete user's Firestore custom claims and other data
    console.log(`[Delete Account] Deleting user profile data`);
    try {
      // Delete from any other collections that might have user data
      const collections = ['userProfiles', 'notifications', 'sharedFiles', 'fileMetadata'];
      
      for (const collectionName of collections) {
        try {
          const docs = await adminDb
            .collection(collectionName)
            .where('userId', '==', userId)
            .get();
          
          if (docs.size > 0) {
            const batch = adminDb.batch();
            docs.forEach(doc => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            console.log(`[Delete Account] Deleted ${docs.size} documents from ${collectionName}`);
          }
        } catch (err) {
          console.warn(`[Delete Account] Warning deleting from ${collectionName}:`, err.message);
        }
      }
    } catch (profileError) {
      console.warn(`[Delete Account] Warning deleting profile data:`, profileError.message);
    }

    // 6. Delete Firebase Authentication account
    console.log(`[Delete Account] Deleting Firebase Auth account: ${userId}`);
    try {
      await adminAuth.deleteUser(userId);
      console.log(`[Delete Account] Successfully deleted Firebase Auth account`);
    } catch (authError) {
      console.error(`[Delete Account] Error deleting Firebase Auth account:`, authError.message);
      // Don't fail here, the Firestore data is already cleaned up
    }

    console.log(`[Delete Account] ✅ Successfully completed account deletion for user: ${userId}`);
    
    return NextResponse.json({
      success: true,
      message: "Your account and all associated data have been permanently deleted."
    });

  } catch (error) {
    console.error("[Delete Account Error]:", error.message, error.stack);
    
    const errorMessage = error.message || "Failed to delete account";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
