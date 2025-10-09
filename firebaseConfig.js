// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with modern cache configuration
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (error) {
  // Already initialized
  db = getFirestore(app);
}

const storage = getStorage(app);

// Configure storage with custom settings
storage.maxUploadRetryTime = 120000; // 2 minutes
storage.maxOperationRetryTime = 120000;

export { db, storage };

/**
 * Custom event emitter for file-related events.
 */
class FileEventEmitter {
    constructor() {
        /** @type {Object<string, Function[]>} */
        this.events = {};
    }

    /**
     * Add an event listener for a specific event.
     * @param {string} event
     * @param {Function} callback
     */
    addEventListener(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    /**
     * Remove an event listener for a specific event.
     * @param {string} event
     * @param {Function} callback
     */
    removeEventListener(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    /**
     * Emit an event to all listeners.
     * @param {string} event
     * @param {any} data
     */
    emit(event, data) {
        if (!this.events[event]) return;
        // Use setTimeout for smoother UI updates
        this.events[event].forEach(callback => setTimeout(() => callback(data), 0));
    }
}

export const fileEvents = new FileEventEmitter();

/**
 * Move a file to the recycle bin.
 * @param {Object} fileData
 * @param {string} fileId
 * @returns {Promise<boolean>}
 */
export const moveToRecycleBin = async (file, fileId) => {
  try {
    const recycleBinRef = doc(db, "recycleBin", fileId);
    const sourceCollectionName = file.type === "folder" ? "uploadedFolders" : "uploadedFiles";
    const sourceRef = doc(db, sourceCollectionName, fileId);

    // Add to recycle bin
    await setDoc(recycleBinRef, {
      ...file,
      deletedAt: serverTimestamp()
    });

    // Delete from source collection
    await deleteDoc(sourceRef);

    return true;
  } catch (error) {
    console.error("Error moving to recycle bin:", error);
    return false;
  }
};

/**
 * Delete all user data from all collections.
 * @param {string} userId
 * @param {string} userEmail
 * @returns {Promise<void>}
 */
export const deleteAllUserData = async (userId, userEmail) => {
    try {
        await deleteDoc(doc(db, "users", userId));
        await deleteDoc(doc(db, "userRoles", userId));
        await deleteDoc(doc(db, "userSubscriptions", userId));
        if (userEmail) {
            await deleteDoc(doc(db, "emailSubscriptions", userEmail));
            // Delete all uploadedFile docs and their storage files
            const filesSnap = await getDocs(query(collection(db, "uploadedFile"), where("userEmail", "==", userEmail)));
            for (const file of filesSnap.docs) {
                const data = file.data();
                if (data.fileUrl) {
                    try {
                        const storageRef = ref(storage, data.fileUrl);
                        await deleteObject(storageRef);
                    } catch (e) {
                        console.warn("Storage file deletion failed:", e);
                    }
                }
                await deleteDoc(file.ref);
            }
            // Delete all uploadedFolders docs and their storage files
            const foldersSnap = await getDocs(query(collection(db, "uploadedFolders"), where("userEmail", "==", userEmail)));
            for (const folder of foldersSnap.docs) {
                const data = folder.data();
                if (data.files && Array.isArray(data.files)) {
                    for (const f of data.files) {
                        if (f.fileUrl) {
                            try {
                                const storageRef = ref(storage, f.fileUrl);
                                await deleteObject(storageRef);
                            } catch (e) {
                                console.warn("Storage file deletion failed:", e);
                            }
                        }
                    }
                }
                await deleteDoc(folder.ref);
            }
            // Delete all recycleBin docs and their storage files
            const recycleSnap = await getDocs(query(collection(db, "recycleBin"), where("userEmail", "==", userEmail)));
            for (const rec of recycleSnap.docs) {
                const data = rec.data();
                if (data.fileUrl) {
                    try {
                        const storageRef = ref(storage, data.fileUrl);
                        await deleteObject(storageRef);
                    } catch (e) {
                        console.warn("Storage file deletion failed:", e);
                    }
                }
                await deleteDoc(rec.ref);
            }
        }
        console.log("All user data deleted for:", userId, userEmail);
    } catch (err) {
        console.error("Error deleting all user data from Firestore:", err);
        throw err;
    }
};

/**
 * Send email verification to the current user.
 * @returns {Promise<boolean>}
 */
export const sendVerificationEmail = async () => {
    const auth = getAuth(app);
    if (auth.currentUser) {
        try {
            await sendEmailVerification(auth.currentUser);
            return true;
        } catch (error) {
            console.error("Error sending verification email:", error);
            return false;
        }
    }
    return false;
};

/**
 * Send password reset email.
 * @param {string} email
 * @returns {Promise<boolean>}
 */
export const sendResetPasswordEmail = async (email) => {
    const auth = getAuth(app);
    try {
        await sendPasswordResetEmail(auth, email);
        return true;
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw error;
    }
};

/**
 * Delete a user from Firebase Authentication (requires Admin SDK, server-side).
 * @param {string} uid
 * @returns {Promise<void>}
 */
// This function is for reference. You must call this from a server-side API route using Firebase Admin SDK.
export const deleteUserFromAuth = async (uid) => {
    // This code must run on your server (Node.js) with Firebase Admin SDK:
    // const admin = require("firebase-admin");
    // await admin.auth().deleteUser(uid);
    // For client-side, you cannot delete other users from Auth.
    throw new Error("deleteUserFromAuth must be called server-side with Firebase Admin SDK.");
};
    // For client-side, you cannot delete other users from Auth.
    throw new Error("deleteUserFromAuth must be called server-side with Firebase Admin SDK.");
};

