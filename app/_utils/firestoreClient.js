import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { app } from "../../firebaseConfig";

let db;

export function getDb() {
  if (!db) {
    try {
      // Try to initialize with cache settings
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch (error) {
      // If already initialized, just get the instance
      console.log('Firestore already initialized, using existing instance');
      db = getFirestore(app);
    }
  }
  
  return db;
}

export default getDb;
