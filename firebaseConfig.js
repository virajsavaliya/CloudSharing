// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, query, where, getDocs, deleteDoc, Timestamp, onSnapshot, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDVMyUGspuZLwjckqv1sb9CpBg3xXkQ56g",
  authDomain: "file-sharing-app-c63a0.firebaseapp.com",
  projectId: "file-sharing-app-c63a0",
  storageBucket: "file-sharing-app-c63a0.appspot.com",
  messagingSenderId: "616447313925",
  appId: "1:616447313925:web:db692a9c95ae28f17df46c",
  measurementId: "G-F5G183J837"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Create custom event emitter
class FileEventEmitter {
    constructor() {
        this.events = {};
    }

    addEventListener(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    removeEventListener(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
}

export const fileEvents = new FileEventEmitter();

// Helper function to move file to recycle bin
export const moveToRecycleBin = async (fileData, fileId) => {
    try {
        await setDoc(doc(db, 'recycleBin', fileId), {
            ...fileData,
            originalLocation: 'uploadedFile'
        });
        await deleteDoc(doc(db, 'uploadedFile', fileId));
        console.log('File moved to recycle bin:', fileId);
        return true;
    } catch (error) {
        console.error('Error moving file to recycle bin:', error);
        return false;
    }
};

// Delete all user data from all collections (call this on account deletion)
export const deleteAllUserData = async (userId, userEmail) => {
    try {
        // Delete user doc
        await deleteDoc(doc(db, "users", userId));
        // Delete userRoles doc
        await deleteDoc(doc(db, "userRoles", userId));
        // Delete userSubscriptions doc
        await deleteDoc(doc(db, "userSubscriptions", userId));
        // Delete emailSubscriptions doc
        if (userEmail) {
            await deleteDoc(doc(db, "emailSubscriptions", userEmail));
        }
        // Delete all uploadedFile docs and their storage files
        if (userEmail) {
            const filesSnap = await getDocs(query(collection(db, "uploadedFile"), where("userEmail", "==", userEmail)));
            for (const file of filesSnap.docs) {
                const data = file.data();
                if (data.fileUrl) {
                    try {
                        const storageRef = ref(storage, data.fileUrl);
                        await deleteObject(storageRef);
                    } catch (e) {}
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
                            } catch (e) {}
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
                    } catch (e) {}
                }
                await deleteDoc(rec.ref);
            }
        }
        // Optionally: delete other user-related collections here
        console.log("All user data deleted for:", userId, userEmail);
    } catch (err) {
        console.error("Error deleting all user data from Firestore:", err);
    }
};