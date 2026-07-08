import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Suppress harmless offline fallback logs from Firestore to prevent platform noise
setLogLevel('silent');

const app = initializeApp(firebaseConfig);

const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}),
}, databaseId);

export const auth = getAuth(app);
