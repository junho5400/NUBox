import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

// Firebase web config is not secret; access is enforced by security rules.
const firebaseConfig = {
  apiKey: 'AIzaSyCjhCbJ7VyecL4rYvQ8rWLdZFTU_pMFY4s',
  authDomain: 'nubox-58de7.firebaseapp.com',
  projectId: 'nubox-58de7',
  storageBucket: 'nubox-58de7.firebasestorage.app',
  messagingSenderId: '1002871695647',
  appId: '1:1002871695647:web:cfff01645b5807da81682a',
};

const useEmulators = import.meta.env.DEV && import.meta.env.MODE === 'e2e';
const emulatorHost = '127.0.0.1';

export const app = initializeApp(useEmulators ? {
  apiKey: 'demo-nubox-key',
  authDomain: `${emulatorHost}:19099`,
  projectId: 'demo-nubox',
  storageBucket: 'demo-nubox.appspot.com',
} : firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

if (useEmulators) {
  connectAuthEmulator(auth, `http://${emulatorHost}:19099`);
  connectFirestoreEmulator(db, emulatorHost, 18080);
  connectStorageEmulator(storage, emulatorHost, 19199);
}
