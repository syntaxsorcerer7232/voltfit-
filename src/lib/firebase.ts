import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setLogLevel } from 'firebase/firestore';

// Configuration is now pulled from environment variables for security.
// These variables must be prefixed with VITE_ in .env.local / AI Studio Secrets.
// We also use the firebase-applet-config.json as a fallback for a zero-config experience.
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId
};

const isBadKey = (key: any) => {
  if (!key || typeof key !== 'string') return true;
  const trimmed = key.trim();
  return trimmed === '' || 
         trimmed === 'placeholder' || 
         trimmed === 'undefined' || 
         trimmed === 'null' || 
         trimmed.includes('[YOUR_') ||
         trimmed.length < 10;
};

export const isFirebaseConfigured = !isBadKey(firebaseConfig.apiKey);

const dummyAuth = { 
  currentUser: null, 
  onAuthStateChanged: (_auth: any, callback: any) => {
    if (typeof callback === 'function') {
      setTimeout(() => callback(null), 0);
    }
    return () => {};
  },
  signOut: () => Promise.resolve(),
} as any;

const dummyDb = {
  _isDummy: true
} as any;

let app: any = null;
let auth: any = dummyAuth;
let db: any = dummyDb;

if (isFirebaseConfigured) {
  try {
    // Only initialize if configured to prevent SDK from throwing on load
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    const databaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || '(default)';
    db = initializeFirestore(app, { 
      localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}) 
    }, databaseId);
  } catch (e) {
    console.error("Firebase SDK failed to initialize with provided config:", e);
    // Fallback to dummy objects
    auth = dummyAuth;
    db = dummyDb;
  }
} else {
  console.warn("Firebase configuration is incomplete. Authentication and database features will be disabled until VITE_FIREBASE_API_KEY is provided or firebase-applet-config.json is populated.");
}

// Suppress harmless offline fallback logs from Firestore to prevent platform noise
setLogLevel('silent');

export { auth, db };
