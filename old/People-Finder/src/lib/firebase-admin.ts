import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminAuth: Auth; // Explicit type for adminAuth
let adminDb: Firestore; // Explicit type for adminDb
let adminStorage: Storage; // Explicit type for adminStorage

if (!getApps().length) {
  const serviceAccount = {
    project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  } as ServiceAccount;

  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  // Initialize Firebase Admin services
  adminAuth = getAuth();
  adminDb = getFirestore();
  adminStorage = getStorage();
} else {
  // Ensure these are defined even if Firebase is already initialized
  adminAuth = getAuth();
  adminDb = getFirestore();
  adminStorage = getStorage();
}

// Export the correctly typed Firebase Admin services
export { adminAuth, adminAuth as auth, adminDb, adminDb as db, adminStorage };
