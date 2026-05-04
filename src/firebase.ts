import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, getDocFromServer, doc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Explicitly set local persistence to ensure users stay logged in
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});

export const googleProvider = new GoogleAuthProvider();

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    // Only log if it's explicitly an unauthenticated or permission-denied error, 
    // which indicates configuration exists but requires rules. 
    // Ignore 'unavailable' which implies offline or sandbox connection issues.
    if(error.code !== 'unavailable' && error.message && error.message.includes('offline')) {
      console.warn("Firebase client is offline. Some features may be unavailable.");
    }
  }
}
testConnection();
